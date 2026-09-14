#!/usr/bin/env node
/**
 * Push the site's URLs to IndexNow.
 *
 * IndexNow is the opposite of a sitemap: instead of waiting for a crawler to come back and
 * re-read a page, it tells the engine "this URL changed, come now". One submission fans out to
 * every participating engine — Bing, Yandex, Seznam, Naver — because they share the feed.
 * Google does not participate, so this supplements the sitemap rather than replacing it.
 *
 * The reason it is worth the twenty lines here: Bing's index is what Copilot and ChatGPT search
 * read, so "how fast does Bing see today's menu" is the same question as "will an assistant
 * asked what's for dinner at Chase quote today's page or last Tuesday's". A menu site where the
 * answer is stale by three days is wrong in the only way that matters.
 *
 * Usage:
 *   node scripts/indexnow.mjs                      # submit everything in the live sitemap
 *   node scripts/indexnow.mjs --dry-run            # print what would be sent, send nothing
 *   node scripts/indexnow.mjs --url /chase/2026-09-14 --url /hours
 */

import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

const SITE_URL = 'https://eatunc.com'
const PUBLIC_DIR = new URL('../public/', import.meta.url).pathname
const ENDPOINT = 'https://api.indexnow.org/indexnow'

// The protocol's own ceiling. We send ~100 URLs, but a future sitemap could grow past it.
const MAX_URLS_PER_REQUEST = 10_000

/**
 * The key file in `public/` is the single source of truth for the key.
 *
 * It is found by shape rather than by a hardcoded filename: IndexNow keys are 8–128 characters
 * of `[a-zA-Z0-9-]`, and the file's only content is the key, which must equal its own basename.
 * That is the same check the search engine performs when it fetches the file, so a key that
 * passes here is a key that will verify — and rotating the key means dropping in a new file,
 * with nothing in this script or the workflow to edit. `llms.txt` and friends do not match,
 * because their contents are not their own names.
 */
async function loadKey() {
    const candidates = (await readdir(PUBLIC_DIR)).filter((name) =>
        /^[a-zA-Z0-9-]{8,128}\.txt$/.test(name),
    )

    const keys = []
    for (const name of candidates) {
        const expected = name.replace(/\.txt$/, '')
        const contents = (await readFile(join(PUBLIC_DIR, name), 'utf8')).trim()
        if (contents === expected) keys.push(expected)
    }

    if (keys.length === 0) {
        throw new Error(
            `No IndexNow key file in public/. Create one: KEY=$(openssl rand -hex 32); printf '%s' "$KEY" > "public/$KEY.txt"`,
        )
    }
    if (keys.length > 1) {
        // Two valid keys means a half-finished rotation, and picking one at random would submit
        // under whichever `readdir` happened to return first.
        throw new Error(`Multiple IndexNow key files in public/: ${keys.join(', ')}`)
    }

    return keys[0]
}

/**
 * Every URL the site currently advertises.
 *
 * Reading the deployed sitemap rather than re-deriving the list keeps one definition of "pages
 * worth crawling" — the window logic in `src/app/sitemap.ts`, which deliberately excludes menu
 * dates outside −7/+14 days. The sitemap is ISR'd at `revalidate = 3600`, so this can be up to
 * an hour stale; that costs nothing here, because staleness would only shift the date window by
 * a day and IndexNow ignores `lastmod` entirely.
 */
async function sitemapUrls() {
    const response = await fetch(`${SITE_URL}/sitemap.xml`, {
        headers: { 'User-Agent': 'eatunc-indexnow/1.0' },
    })
    if (!response.ok) {
        throw new Error(`sitemap.xml returned ${response.status} ${response.statusText}`)
    }

    const xml = await response.text()
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) =>
        m[1].trim().replace(/&amp;/g, '&'),
    )
    if (urls.length === 0) throw new Error('sitemap.xml parsed to zero URLs')

    return urls
}

function parseArgs(argv) {
    const explicit = []
    let dryRun = false

    for (let i = 0; i < argv.length; i++) {
        if (argv[i] === '--dry-run') dryRun = true
        else if (argv[i] === '--url') {
            const value = argv[++i]
            if (!value) throw new Error('--url needs a value')
            explicit.push(value.startsWith('http') ? value : `${SITE_URL}${value}`)
        } else throw new Error(`Unknown argument: ${argv[i]}`)
    }

    return { explicit, dryRun }
}

async function submit(chunk, key) {
    const response = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
            host: new URL(SITE_URL).host,
            key,
            keyLocation: `${SITE_URL}/${key}.txt`,
            urlList: chunk,
        }),
    })

    // 200 is accepted, 202 is "accepted, key validation pending" — the engine fetches the key
    // file on its own schedule, so a fresh key legitimately reports 202 for a while.
    if (response.status !== 200 && response.status !== 202) {
        const body = await response.text().catch(() => '')
        throw new Error(`IndexNow returned ${response.status} ${response.statusText} ${body}`.trim())
    }

    return response.status
}

async function main() {
    const { explicit, dryRun } = parseArgs(process.argv.slice(2))
    const key = await loadKey()

    const all = explicit.length > 0 ? explicit : await sitemapUrls()

    // A 422 rejects the whole batch, so one stray off-host URL would drop every menu page with
    // it. Cheaper to drop it here and say so.
    const urls = all.filter((url) => url.startsWith(`${SITE_URL}/`) || url === SITE_URL)
    const dropped = all.length - urls.length
    if (dropped > 0) console.warn(`[indexnow] skipped ${dropped} URL(s) not on ${SITE_URL}`)
    if (urls.length === 0) throw new Error('Nothing to submit')

    if (dryRun) {
        console.log(`[indexnow] dry run — ${urls.length} URL(s), key ${key}`)
        for (const url of urls) console.log(`  ${url}`)
        return
    }

    for (let i = 0; i < urls.length; i += MAX_URLS_PER_REQUEST) {
        const chunk = urls.slice(i, i + MAX_URLS_PER_REQUEST)
        const status = await submit(chunk, key)
        console.log(`[indexnow] submitted ${chunk.length} URL(s) — HTTP ${status}`)
    }
}

main().catch((error) => {
    console.error(`[indexnow] ${error.message}`)
    process.exit(1)
})
