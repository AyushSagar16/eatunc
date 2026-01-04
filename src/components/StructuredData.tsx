import Script from 'next/script';

interface StructuredDataProps {
    hall: string;
    date: string;
}

export default function StructuredData({ hall, date }: StructuredDataProps) {
    const hallNames: Record<string, string> = {
        chase: 'Chase Dining Hall',
        lenoir: 'Top of Lenoir Dining Hall',
    };

    const hallName = hallNames[hall] || hall;

    const structuredData = {
        "@context": "https://schema.org",
        "@type": "Restaurant",
        "name": hallName,
        "description": `${hallName} at University of North Carolina at Chapel Hill`,
        "servesCuisine": "American",
        "priceRange": "$$",
        "address": {
            "@type": "PostalAddress",
            "addressLocality": "Chapel Hill",
            "addressRegion": "NC",
            "addressCountry": "US"
        },
        "parentOrganization": {
            "@type": "Organization",
            "name": "UNC Dining",
            "url": "https://dining.unc.edu"
        },
        "url": `https://eatunc.com/${hall}/${date}`,
        "hasMenu": {
            "@type": "Menu",
            "name": `${hallName} Menu for ${date}`,
            "description": `Daily menu for ${hallName}`,
            "url": `https://eatunc.com/${hall}/${date}`
        }
    };

    const websiteData = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "UNC Dining Menu",
        "url": "https://eatunc.com",
        "description": "View daily menus for UNC Chapel Hill dining halls including Chase and Top of Lenoir",
        "potentialAction": {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": "https://eatunc.com/{hall}/{date}"
            },
            "query-input": "required name=hall required name=date"
        }
    };

    return (
        <>
            <Script
                id="structured-data-restaurant"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
            />
            <Script
                id="structured-data-website"
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteData) }}
            />
        </>
    );
}
