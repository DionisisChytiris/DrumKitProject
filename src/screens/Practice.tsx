import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { audioManager } from '../utils/audioManager';
import { DrumPiece } from '../types';
import { useAppSelector } from '@/store/hooks';
import { KeyBindingModal } from '@/Modals/KeyBindingModal';
import './styles/Practice.css';
import { NavBarHome } from '@/components/Navigation/NavBarHome';

// Base reference dimensions (Full HD - 1920x1080)
// All sizes will scale proportionally from this base
const BASE_WIDTH = 1920;
const BASE_HEIGHT = 1080;

const Practice: React.FC = () => {
    const navigate = useNavigate();
    const { drumKit } = useAppSelector((state) => state.drumKit);
    const [activeDrums, setActiveDrums] = useState<Set<string>>(new Set());
    const [viewportSize, setViewportSize] = useState({ width: window.innerWidth, height: window.innerHeight });
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isKeyBindingModalOpen, setIsKeyBindingModalOpen] = useState(false);

    // Check if currently in fullscreen
    const checkFullscreen = useCallback(() => {
        const isFull = !!(
            document.fullscreenElement ||
            (document as any).webkitFullscreenElement ||
            (document as any).mozFullScreenElement ||
            (document as any).msFullscreenElement
        );
        setIsFullscreen(isFull);
        return isFull;
    }, []);

    // Request fullscreen
    const requestFullscreen = useCallback(async () => {
        const element = document.documentElement;
        try {
            if (element.requestFullscreen) {
                await element.requestFullscreen();
            } else if ((element as any).webkitRequestFullscreen) {
                await (element as any).webkitRequestFullscreen();
            } else if ((element as any).mozRequestFullScreen) {
                await (element as any).mozRequestFullScreen();
            } else if ((element as any).msRequestFullscreen) {
                await (element as any).msRequestFullscreen();
            }
        } catch (error) {
            console.error('Error requesting fullscreen:', error);
        }
    }, []);

    // Monitor fullscreen changes
    useEffect(() => {
        checkFullscreen(); // Initial check

        const handleFullscreenChange = () => {
            checkFullscreen();
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, [checkFullscreen]);

    const handleDrumClick = useCallback((drumPiece: DrumPiece) => {
        // Only allow clicks when in fullscreen
        if (!isFullscreen) {
            return;
        }

        // Debug: Log what we're trying to play
        console.log(`[Practice] Playing ${drumPiece.id}, audioUrl:`, drumPiece.audioUrl);

        // Play sound
        audioManager.playSound(drumPiece.id, drumPiece.audioUrl);

        // Visual feedback
        setActiveDrums((prev) => new Set(prev).add(drumPiece.id));
        setTimeout(() => {
            setActiveDrums((prev) => {
                const next = new Set(prev);
                next.delete(drumPiece.id);
                return next;
            });
        }, 150);
    }, [isFullscreen]);

    // Handle window resize for responsive positioning
    useEffect(() => {
        const handleResize = () => {
            setViewportSize({ width: window.innerWidth, height: window.innerHeight });
        };

        window.addEventListener('resize', handleResize);
        // Also handle orientation changes
        window.addEventListener('orientationchange', handleResize);
        
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);
        };
    }, []);

    // Keyboard support (only when in fullscreen)
    useEffect(() => {
        if (!isFullscreen) return;

        const handleKeyPress = (event: KeyboardEvent) => {
            // Handle Space key specially
            let key = event.key;
            if (key === ' ') {
                key = 'Space';
            } else {
                key = key.toUpperCase();
            }
            
            const drumPiece = drumKit.find(
                (drum) => {
                    const binding = drum.keyBinding?.toUpperCase();
                    // Handle Space key binding
                    if (binding === 'SPACE' && event.key === ' ') {
                        return true;
                    }
                    return binding === key;
                }
            );

            if (drumPiece) {
                event.preventDefault();
                handleDrumClick(drumPiece);
            }
        };

        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [handleDrumClick, isFullscreen, drumKit]);

    // Custom positions to match the actual drum kit in DrumStudio1.png background
    // Positions are relative to the right-side overlay (50% width, positioned on right)
    // x values are percentage within the overlay (0-100%), where higher = more to the right
    // All pixel values are based on BASE_WIDTH x BASE_HEIGHT and scale proportionally
    interface DrumPosition {
        x: number;              // X position in percentage (0-100%)
        y: number;              // Y position in percentage (0-100%)
        width: number;          // Width in base pixels (will scale to viewport)
        height: number;         // Height in base pixels (will scale to viewport)
        offsetX?: number;       // Fine X adjustment in base pixels (will scale) - DEPRECATED: use offsetXPercent
        offsetY?: number;       // Fine Y adjustment in base pixels (will scale) - DEPRECATED: use offsetYPercent
        offsetXPercent?: number; // Fine X adjustment as percentage of viewport width (e.g., 1.5 = 1.5% of viewport width)
        offsetYPercent?: number; // Fine Y adjustment as percentage of viewport height (e.g., 1.5 = 1.5% of viewport height)
        scale?: number;         // Scale multiplier (1.0 = 100%, 1.2 = 120%, etc.)
        borderRadius?: number | string; // Border radius (px or percentage, default: 50% for circle)
        rotation?: number;       // Rotation in degrees
        transformOrigin?: string; // Transform origin (default: 'center center')
    }

    // Calculate responsive adjustments based on viewport size
    // This compensates for different screen sizes and aspect ratios
    const getResponsiveAdjustments = useCallback(() => {
        // Calculate scale factors relative to base resolution
        const widthScale = viewportSize.width / BASE_WIDTH;
        const heightScale = viewportSize.height / BASE_HEIGHT;
        
        // Determine screen size category
        const isSmallScreen = viewportSize.width < 1600 || viewportSize.height < 500;
        const isMediumScreen = viewportSize.width >= 1600 && viewportSize.width < 2400;
        
        // Calculate adjustments to compensate for scaling differences
        // On smaller screens, positions need more adjustment
        // The adjustment is based on how much the viewport differs from base
        let xAdjustment = 0;
        let yAdjustment = 0;
        
        if (isSmallScreen) {
            // For small screens (like 15" laptop), adjust positions more
            // Compensate for the fact that viewport units scale differently
            xAdjustment = (widthScale - 1) * 3; // More X adjustment for small screens
            yAdjustment = (heightScale - 1) * 22; // Y adjustment for small screens
        } else if (isMediumScreen) {
            // For medium screens, smaller adjustments
            xAdjustment = (widthScale - 1) * 1;
            yAdjustment = (heightScale - 1) * 0.5;
        }
        // Large screens (27"+) don't need adjustments
        
        return {
            xAdjustment,
            yAdjustment,
            widthScale,
            heightScale,
            isSmallScreen
        };
    }, [viewportSize]);

    const getDrumPosition = (drumId: string): DrumPosition => {
        const customPositions: Record<string, DrumPosition> = {
            'kick': { 
                x: 38, y: 60, width: 160, height: 160,
                offsetX: 0, offsetY: 0, scale: 1.0,
                borderRadius: '50%',
                rotation: 0,
                transformOrigin: 'center center'
            },
            'snare': { 
                x: 49.8, y: 49.5, width: 210, height: 75,
                offsetXPercent: 0.2, offsetYPercent: 0, scale: 1.0,
                borderRadius: '70%',
                rotation: 16,
                transformOrigin: 'center center'
            },
            'hihat': { 
                x: 31.8, y: 40.9, width: 225, height: 67,
                offsetX: 0, offsetY: 0, scale: 1.0,
                borderRadius: '50%',
                rotation: 8,
                transformOrigin: 'center center'
            },
            'high-tom': { 
                x: 38.5, y: 35.3, width: 138, height: 60,
                offsetX: 0, offsetY: 0, scale: 1.0,
                borderRadius: '49%',
                rotation: 30,
                transformOrigin: 'center center'
            },
            'mid-tom': { 
                x: 47.5, y: 33.3, width: 138, height: 64,
                offsetX: 0, offsetY: 0, scale: 1.0,
                borderRadius: '50%',
                rotation: 30,
                transformOrigin: 'center center'
            },
            'floor-tom': { 
                x: 63, y: 42, width: 178, height: 60,
                offsetX: 0, offsetY: 0, scale: 1.0,
                borderRadius: '50%',
                rotation: 10,
                transformOrigin: 'center center'
            },
            'low-floor-tom': { 
                x: 84.5, y: 43.5, width: 215, height: 70,
                offsetX: 0, offsetY: 0, scale: 1.0,
                borderRadius: '50%',
                rotation: 10,
                transformOrigin: 'center center'
            },
            'crash': { 
                x: 25.2, y: 24.8, width: 225, height: 48,
                offsetX: 0, offsetY: 0, scale: 1.0,
                borderRadius: '50%',
                rotation: 14,
                transformOrigin: 'center center'
            },
            'crash-2': { 
                x: 51.4, y: 20.8, width: 205, height: 55,
                offsetX: 0, offsetY: 0, scale: 1.0,
                borderRadius: '50%',
                rotation: 10,
                transformOrigin: 'center center'
            },
            'ride': { 
                x: 61.6, y: 30.5, width: 235, height: 85,
                offsetX: 0, offsetY: 0, scale: 1.0,
                borderRadius: '50%',
                rotation: 12,
                transformOrigin: 'center center'
            },
            'china': { 
                x: 79.5, y: 23.1, width: 227, height: 75,
                offsetX: 0, offsetY: 0, scale: 1.0,
                borderRadius: '50%',
                rotation: 7,
                transformOrigin: 'center center'
            },
        };
        
        return customPositions[drumId] || { 
            x: 50, y: 50, width: 100, height: 100,
            offsetX: 0, offsetY: 0, scale: 1.0,
            borderRadius: '50%',
            rotation: 0,
            transformOrigin: 'center center'
        };
    };

    return (
        <div className="practice-container">
            <NavBarHome/>
            <div className="practice-background"></div>
            <div className="practice-content">
                <button 
                    className="practice-back-button"
                    onClick={() => navigate('/hometest')}
                >
                    ← Back
                </button>
                {!isFullscreen && (
                    <div className="practice-fullscreen-overlay">
                        <div className="practice-fullscreen-message">
                            <h2>🎵 Fullscreen Required</h2>
                            <p>Please enter fullscreen mode to play the drum kit</p>
                            <button 
                                className="practice-fullscreen-button"
                                onClick={requestFullscreen}
                            >
                                Enter Fullscreen
                            </button>
                            <p className="practice-fullscreen-hint">
                                Press <kbd>F11</kbd> or click the button above
                            </p>
                        </div>
                    </div>
                )}
                <div className="practice-main">
                    {/* Invisible clickable drum kit areas */}
                    <div className="practice-drum-kit-overlay">
                        {drumKit.map((drumPiece) => {
                            const customPos = getDrumPosition(drumPiece.id);
                            const isActive = activeDrums.has(drumPiece.id);
                            const adjustments = getResponsiveAdjustments();
                            
                            // Convert base pixel sizes to viewport-relative units (vw/vh)
                            // This ensures consistent sizing across all screen sizes and aspect ratios
                            // Base width (1920px) = 100vw, so: widthInVw = (baseWidth / 1920) * 100
                            // Base height (1080px) = 100vh, so: heightInVh = (baseHeight / 1080) * 100
                            const widthInVw = (customPos.width / BASE_WIDTH) * 100;
                            const heightInVh = (customPos.height / BASE_HEIGHT) * 100;
                            
                            // Apply responsive position adjustments
                            const adjustedX = customPos.x + adjustments.xAdjustment;
                            const adjustedY = customPos.y + adjustments.yAdjustment;
                            
                            // Calculate offsets - prefer percentage offsets over pixel offsets
                            let offsetX = 0;
                            let offsetY = 0;
                            
                            if (customPos.offsetXPercent !== undefined || customPos.offsetYPercent !== undefined) {
                                // Use percentage-based offsets (relative to viewport)
                                offsetX = customPos.offsetXPercent !== undefined 
                                    ? (viewportSize.width * customPos.offsetXPercent / 100)
                                    : 0;
                                offsetY = customPos.offsetYPercent !== undefined 
                                    ? (viewportSize.height * customPos.offsetYPercent / 100)
                                    : 0;
                            } else {
                                // Convert pixel offsets to viewport-relative
                                offsetX = (customPos.offsetX || 0) / BASE_WIDTH * viewportSize.width;
                                offsetY = (customPos.offsetY || 0) / BASE_HEIGHT * viewportSize.height;
                            }
                            
                            // Build transform string with offsets, scale, and rotation
                            const transforms: string[] = ['translate(-50%, -50%)'];
                            
                            // Apply offsets using translate
                            if (offsetX !== 0 || offsetY !== 0) {
                                transforms.push(`translate(${offsetX}px, ${offsetY}px)`);
                            }
                            
                            // Apply scale
                            if (customPos.scale && customPos.scale !== 1.0) {
                                transforms.push(`scale(${customPos.scale})`);
                            }
                            
                            // Apply rotation
                            if (customPos.rotation && customPos.rotation !== 0) {
                                transforms.push(`rotate(${customPos.rotation}deg)`);
                            }
                            
                            // Active state scale (applied last)
                            if (isActive) {
                                transforms.push('scale(1.1)');
                            }
                            
                            return (
                                <div
                                    key={drumPiece.id}
                                    className={`practice-drum-hit-zone ${isActive ? 'active' : ''}`}
                                    style={{
                                        left: `${adjustedX}%`,
                                        top: `${adjustedY}%`,
                                        width: `${widthInVw}vw`,
                                        height: `${heightInVh}vh`,
                                        borderRadius: customPos.borderRadius || '50%',
                                        transform: transforms.join(' '),
                                        transformOrigin: customPos.transformOrigin || 'center center',
                                        pointerEvents: isFullscreen ? 'all' : 'none',
                                        opacity: isFullscreen ? 1 : 0.3,
                                    }}
                                    onClick={() => handleDrumClick(drumPiece)}
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`${drumPiece.name} (${drumPiece.keyBinding || 'No key'})`}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            handleDrumClick(drumPiece);
                                        }
                                    }}
                                >
                                    {drumPiece.keyBinding && (
                                        <span className="practice-drum-key-hint">{drumPiece.keyBinding}</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                    <div className="practice-instructions">
                        <div className="practice-instructions-header">
                            <p>Click on the drum kit or use keyboard keys to play</p>
                            <button 
                                className="practice-edit-keys-button"
                                onClick={() => setIsKeyBindingModalOpen(true)}
                                title="Customize keyboard keys"
                            >
                                ✏️ Edit Keys
                            </button>
                        </div>
                        <p className="practice-key-hints">
                            {drumKit.map(d => d.keyBinding && (
                                <span key={d.id} className="key-hint">
                                    <kbd>{d.keyBinding}</kbd> - {d.name}
                                </span>
                            ))}
                        </p>
                    </div>
                    <KeyBindingModal 
                        isOpen={isKeyBindingModalOpen} 
                        onClose={() => setIsKeyBindingModalOpen(false)} 
                    />
                </div>
            </div>
        </div>
    );
};

export default Practice;
