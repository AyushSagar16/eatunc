import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import MenuViewToggle from '@/components/MenuViewToggle'

describe('MenuViewToggle', () => {
    it('marks compact as active and switches to cards on click', () => {
        const onViewModeChange = vi.fn()

        const { container } = render(
            <MenuViewToggle
                viewMode="compact"
                onViewModeChange={onViewModeChange}
            />
        )

        const compactButton = container.querySelector<HTMLButtonElement>('button[aria-label="Switch to compact view"]')
        const cardsButton = container.querySelector<HTMLButtonElement>('button[aria-label="Switch to cards view"]')

        expect(compactButton).toHaveAttribute('aria-pressed', 'true')
        expect(cardsButton).toHaveAttribute('aria-pressed', 'false')

        cardsButton?.click()

        expect(onViewModeChange).toHaveBeenCalledWith('regular')
        expect(onViewModeChange).toHaveBeenCalledTimes(1)
    })

    it('marks cards as active when regular mode is selected', () => {
        const { container } = render(
            <MenuViewToggle
                viewMode="regular"
                onViewModeChange={() => undefined}
            />
        )

        expect(container.querySelector('button[aria-label="Switch to cards view"]')).toHaveAttribute('aria-pressed', 'true')
        expect(container.querySelector('button[aria-label="Switch to compact view"]')).toHaveAttribute('aria-pressed', 'false')
    })
})
