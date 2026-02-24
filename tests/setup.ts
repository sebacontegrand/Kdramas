import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Three.js since it's hard to test in JSDOM
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

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));
