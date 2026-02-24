import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OriginLanding from '@/components/OriginLanding';
import { vi, describe, it, expect } from 'vitest';

// Explicitly mock three in the test file to handle potential ESM issues
vi.mock('three', () => {
    const MockObj = vi.fn(() => ({
        add: vi.fn(),
        remove: vi.fn(),
        position: { set: vi.fn(), x: 0, y: 0, z: 0 },
        rotation: { set: vi.fn(), x: 0, y: 0, z: 0 },
        scale: { set: vi.fn(), x: 1, y: 1, z: 1 },
    }));

    return {
        Scene: MockObj,
        PerspectiveCamera: MockObj,
        WebGLRenderer: vi.fn(() => ({
            setSize: vi.fn(),
            setPixelRatio: vi.fn(),
            render: vi.fn(),
            domElement: document.createElement('div'),
            dispose: vi.fn(),
        })),
        PlaneGeometry: MockObj,
        ShaderMaterial: MockObj,
        Mesh: MockObj,
        Vector2: vi.fn(() => ({ lerp: vi.fn(), x: 0, y: 0, set: vi.fn() })),
        Color: vi.fn(() => ({ set: vi.fn() })),
        Clock: vi.fn(() => ({ getElapsedTime: vi.fn(() => 0) })),
    };
});

describe('OriginLanding Unit Tests', () => {
    it('renders the landing title', () => {
        const onSelect = vi.fn();
        render(<OriginLanding onSelect={onSelect} />);
        expect(screen.getByText(/Deep/i)).toBeInTheDocument();
        expect(screen.getByText(/Dimensions/i)).toBeInTheDocument();
    });

    it('renders all origin options', () => {
        const onSelect = vi.fn();
        render(<OriginLanding onSelect={onSelect} />);
        expect(screen.getByText('Worldwide')).toBeInTheDocument();
        expect(screen.getByText('South Korea')).toBeInTheDocument();
        expect(screen.getByText('China')).toBeInTheDocument();
        expect(screen.getByText('Japan')).toBeInTheDocument();
    });

    it('calls onSelect when a card is clicked', async () => {
        vi.useFakeTimers();
        const onSelect = vi.fn();
        render(<OriginLanding onSelect={onSelect} />);

        const krButton = screen.getByText('South Korea').closest('button');
        if (!krButton) throw new Error('Button not found');

        fireEvent.click(krButton);

        // Fast-forward timeout (600ms in implementation)
        vi.advanceTimersByTime(600);

        expect(onSelect).toHaveBeenCalledWith('KR');
        vi.useRealTimers();
    });
});
