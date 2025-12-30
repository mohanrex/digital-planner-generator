import React, { useState, useEffect, useRef } from 'react';
import type { PlannerConfig } from '../core/types';
import { Download, Settings, Loader2, Tablet, Layout, Palette, Calendar } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(inputs));
}

const PlannerConfigurator: React.FC = () => {
    const [config, setConfig] = useState<PlannerConfig>({
        year: new Date().getFullYear() + 1,
        startMonth: 1,
        durationMonths: 12,
        weekStart: 'sunday',
        device: 'tab-s',
        orientation: 'portrait',
        handedness: 'right',
        theme: {
            accentColor: '#3b82f6',
            font: 'Helvetica',
            lineHeight: 1.2,
        },
        customSections: []
    });

    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');
    const workerRef = useRef<Worker | null>(null);

    useEffect(() => {
        workerRef.current = new Worker(new URL('../worker/pdf.worker.ts', import.meta.url), {
            type: 'module',
        });

        workerRef.current.onmessage = (e) => {
            const { type, value, message, data, error } = e.data;

            if (type === 'progress') {
                setProgress(value);
                setStatusMessage(message);
            } else if (type === 'complete') {
                setIsGenerating(false);
                setStatusMessage('Generation Complete!');

                const blob = new Blob([data], { type: 'application/pdf' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `planner-${config.year}-${config.device}-${config.orientation}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
            } else if (type === 'error') {
                setIsGenerating(false);
                setStatusMessage(`Error: ${error}`);
                console.error(error);
            }
        };

        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    const handleGenerate = () => {
        setIsGenerating(true);
        setProgress(0);
        setStatusMessage('Initializing...');
        workerRef.current?.postMessage(config);
    };

    return (
        <div className="flex h-screen bg-galaxy-900 text-white font-sans selection:bg-accent-500/30">
            {/* Sidebar Config */}
            <div className="w-96 bg-galaxy-800 border-r border-white/10 flex flex-col shadow-2xl z-10">
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-accent-500/20 rounded-lg">
                            <Settings className="w-6 h-6 text-accent-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-white">Galaxy Forge</h1>
                            <p className="text-xs text-gray-400 font-medium">PLANNER GENERATOR</p>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">

                    {/* Section: Timeframe */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-400 uppercase tracking-wider">
                            <Calendar className="w-4 h-4" />
                            Timeframe
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-400">Year</label>
                                <input
                                    type="number"
                                    value={config.year}
                                    onChange={(e) => setConfig({ ...config, year: parseInt(e.target.value) })}
                                    className="w-full bg-galaxy-700 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-all appearance-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-400">Week Start</label>
                                <select
                                    value={config.weekStart}
                                    onChange={(e) => setConfig({ ...config, weekStart: e.target.value as any })}
                                    className="w-full bg-galaxy-700 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-accent-500 focus:ring-1 focus:ring-accent-500 transition-all appearance-none"
                                >
                                    <option value="sunday">Sunday</option>
                                    <option value="monday">Monday</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* Section: Device & Layout */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-400 uppercase tracking-wider">
                            <Tablet className="w-4 h-4" />
                            Device Profile
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { id: 'tab-s', label: 'Samsung Tab S (16:10)', icon: Tablet },
                            ].map((device) => (
                                <button
                                    key={device.id}
                                    onClick={() => setConfig({ ...config, device: device.id as any })}
                                    className={cn(
                                        "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left group",
                                        config.device === device.id
                                            ? "bg-accent-500/20 border-accent-500/50 text-accent-500"
                                            : "bg-galaxy-700 border-transparent hover:bg-galaxy-700/80 text-gray-300"
                                    )}
                                >
                                    <device.icon className={cn("w-5 h-5", config.device === device.id ? "text-accent-500" : "text-gray-500 group-hover:text-gray-300")} />
                                    <span className="font-medium">{device.label}</span>
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Section: Orientation */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-400 uppercase tracking-wider">
                            <Layout className="w-4 h-4" />
                            Orientation
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            {['portrait', 'landscape'].map((mode) => (
                                <button
                                    key={mode}
                                    disabled={mode === 'landscape'}
                                    onClick={() => setConfig({ ...config, orientation: mode as any })}
                                    className={cn(
                                        "flex flex-col items-center justify-center gap-2 py-4 rounded-xl border transition-all relative overflow-hidden",
                                        config.orientation === mode
                                            ? "bg-accent-500/20 border-accent-500/50 text-accent-500"
                                            : mode === 'landscape'
                                                ? "bg-galaxy-700/50 border-transparent text-gray-600 cursor-not-allowed opacity-50"
                                                : "bg-galaxy-700 border-transparent hover:bg-galaxy-700/80 text-gray-400"
                                    )}
                                >
                                    <div className={cn(
                                        "border-2 rounded-sm",
                                        mode === 'portrait' ? "w-4 h-6" : "w-6 h-4",
                                        config.orientation === mode ? "border-accent-500" : "border-gray-500"
                                    )} />
                                    <span className="text-xs font-medium capitalize">{mode}</span>
                                    {mode === 'landscape' && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[1px]">
                                            <span className="text-[10px] font-bold text-white bg-red-500/80 px-2 py-0.5 rounded-full">Coming Soon</span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Section: Aesthetics */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-400 uppercase tracking-wider">
                            <Palette className="w-4 h-4" />
                            Theme & Typography
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-400">Accent Color</label>
                                <div className="flex gap-3 items-center">
                                    {['#3b82f6', '#ef4444', '#10b981', '#8b5cf6', '#f59e0b'].map(color => (
                                        <button
                                            key={color}
                                            onClick={() => setConfig({ ...config, theme: { ...config.theme, accentColor: color } })}
                                            className={cn(
                                                "w-8 h-8 rounded-full border-2 transition-all",
                                                config.theme.accentColor === color ? "border-white scale-110" : "border-transparent hover:scale-105"
                                            )}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                    <div className="relative group">
                                        <input
                                            type="color"
                                            value={config.theme.accentColor}
                                            onChange={(e) => setConfig({ ...config, theme: { ...config.theme, accentColor: e.target.value } })}
                                            className="w-8 h-8 rounded-full overflow-hidden cursor-pointer border-0 p-0"
                                        />
                                        <div className="absolute inset-0 rounded-full border-2 border-white/20 pointer-events-none group-hover:border-white/50" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-400 flex justify-between">
                                    <span>Line Height (Notes)</span>
                                    <span className="text-accent-500">{config.theme.lineHeight || 1.2}x</span>
                                </label>
                                <input
                                    type="range"
                                    min="1.0"
                                    max="2.0"
                                    step="0.1"
                                    value={config.theme.lineHeight || 1.2}
                                    onChange={(e) => setConfig({ ...config, theme: { ...config.theme, lineHeight: parseFloat(e.target.value) } })}
                                    className="w-full h-2 bg-galaxy-700 rounded-lg appearance-none cursor-pointer accent-accent-500"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Section: Custom Sections (Appendix) */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between text-sm font-semibold text-gray-400 uppercase tracking-wider">
                            <div className="flex items-center gap-2">
                                <Layout className="w-4 h-4" />
                                Appendix Sections
                            </div>
                            <button
                                onClick={() => setConfig({
                                    ...config,
                                    customSections: [
                                        ...config.customSections,
                                        { title: 'New Section', pageCount: 10, template: 'lined' }
                                    ]
                                })}
                                className="text-xs bg-accent-500/10 text-accent-500 px-2 py-1 rounded hover:bg-accent-500/20 transition-colors"
                            >
                                + Add
                            </button>
                        </div>

                        <div className="space-y-3">
                            {config.customSections.map((section, index) => (
                                <div key={index} className="bg-galaxy-700 rounded-lg p-3 space-y-3 border border-white/5">
                                    <div className="flex justify-between items-center gap-2">
                                        <input
                                            type="text"
                                            value={section.title}
                                            onChange={(e) => {
                                                const newSections = [...config.customSections];
                                                newSections[index].title = e.target.value;
                                                setConfig({ ...config, customSections: newSections });
                                            }}
                                            className="bg-transparent border-b border-white/10 w-full text-sm focus:outline-none focus:border-accent-500"
                                            placeholder="Section Title"
                                        />
                                        <button
                                            onClick={() => {
                                                const newSections = config.customSections.filter((_, i) => i !== index);
                                                setConfig({ ...config, customSections: newSections });
                                            }}
                                            className="text-gray-500 hover:text-red-400"
                                        >
                                            &times;
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[10px] text-gray-500 uppercase">Pages</label>
                                            <input
                                                type="number"
                                                value={section.pageCount}
                                                onChange={(e) => {
                                                    const newSections = [...config.customSections];
                                                    newSections[index].pageCount = parseInt(e.target.value);
                                                    setConfig({ ...config, customSections: newSections });
                                                }}
                                                className="w-full bg-galaxy-800 rounded px-2 py-1 text-xs border border-white/5"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] text-gray-500 uppercase">Template</label>
                                            <select
                                                value={section.template}
                                                onChange={(e) => {
                                                    const newSections = [...config.customSections];
                                                    newSections[index].template = e.target.value as any;
                                                    setConfig({ ...config, customSections: newSections });
                                                }}
                                                className="w-full bg-galaxy-800 rounded px-2 py-1 text-xs border border-white/5"
                                            >
                                                <option value="lined">Lined</option>
                                                <option value="dotted">Dotted</option>
                                                <option value="blank">Blank</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {config.customSections.length === 0 && (
                                <div className="text-center py-4 text-xs text-gray-500 italic border border-dashed border-white/10 rounded-lg">
                                    No custom sections added
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Section: Cover Page */}
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-gray-400 uppercase tracking-wider">
                            <Layout className="w-4 h-4" />
                            Cover Page
                        </div>
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-400">Title</label>
                                <input
                                    type="text"
                                    value={config.cover?.title || ''}
                                    onChange={(e) => setConfig({ ...config, cover: { ...config.cover, title: e.target.value } })}
                                    placeholder="My 2025 Planner"
                                    className="w-full bg-galaxy-700 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-accent-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-400">Subtitle</label>
                                <input
                                    type="text"
                                    value={config.cover?.subtitle || ''}
                                    onChange={(e) => setConfig({ ...config, cover: { ...config.cover, subtitle: e.target.value } })}
                                    placeholder="Dream Big"
                                    className="w-full bg-galaxy-700 border border-white/10 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-accent-500"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-gray-400">Background Image</label>

                                {/* Presets Grid */}
                                <div className="grid grid-cols-5 gap-2 mb-2">
                                    {[
                                        { id: 'geometric', src: 'covers/geometric.png', label: 'Geo' },
                                        { id: 'nature', src: 'covers/nature.png', label: 'Nature' },
                                        { id: 'abstract', src: 'covers/abstract.png', label: 'Abstract' },
                                        { id: 'spaceship', src: 'covers/spaceship.png', label: 'Space' },
                                        { id: 'cat', src: 'covers/cat.png', label: 'Cat' },
                                    ].map((preset) => (
                                        <button
                                            key={preset.id}
                                            onClick={async () => {
                                                try {
                                                    const response = await fetch(preset.src);
                                                    const blob = await response.blob();
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        setConfig({ ...config, cover: { ...config.cover, image: reader.result as string } });
                                                    };
                                                    reader.readAsDataURL(blob);
                                                } catch (error) {
                                                    console.error('Error loading preset:', error);
                                                }
                                            }}
                                            className={cn(
                                                "relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all group",
                                                // Check if current image starts with data: (base64) and we can't easily compare to src, 
                                                // so we might lose the active state visual, but functionality is key.
                                                // Or we could store the selected preset ID separately.
                                                // For now, let's just rely on the click.
                                                "border-transparent hover:border-white/30"
                                            )}
                                        >
                                            <img src={preset.src} alt={preset.label} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[10px] font-bold text-white">{preset.label}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <div className="relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => {
                                                    setConfig({ ...config, cover: { ...config.cover, image: reader.result as string } });
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                        className="hidden"
                                        id="cover-upload"
                                    />
                                    <label
                                        htmlFor="cover-upload"
                                        className="flex items-center justify-center w-full px-4 py-3 border-2 border-dashed border-white/10 rounded-lg cursor-pointer hover:border-accent-500/50 hover:bg-accent-500/5 transition-all"
                                    >
                                        <span className="text-xs text-gray-400">
                                            {config.cover?.image?.startsWith('data:') ? 'Change Uploaded Image' : 'Upload Custom Image'}
                                        </span>
                                    </label>
                                    {config.cover?.image && (
                                        <button
                                            onClick={() => setConfig({ ...config, cover: { ...config.cover, image: undefined } })}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-red-400 hover:text-red-300"
                                        >
                                            Remove
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                </div>

                <div className="p-6 border-t border-white/10 bg-galaxy-800">
                    <button
                        onClick={handleGenerate}
                        disabled={isGenerating}
                        className={cn(
                            "w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg transition-all shadow-lg hover:shadow-accent-500/20",
                            isGenerating
                                ? "bg-galaxy-700 cursor-not-allowed text-gray-400"
                                : "bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white"
                        )}
                    >
                        {isGenerating ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Download className="w-5 h-5" />
                                Generate Planner
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 bg-galaxy-900 relative overflow-hidden flex flex-col">
                {/* Background Pattern */}
                <div className="absolute inset-0 opacity-20"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
                        backgroundSize: '24px 24px'
                    }}
                />

                <div className="flex-1 flex items-center justify-center relative z-10 p-10">
                    {isGenerating ? (
                        <div className="w-full max-w-md space-y-6 text-center">
                            <div className="relative w-32 h-32 mx-auto">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle
                                        cx="64"
                                        cy="64"
                                        r="60"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        className="text-galaxy-700"
                                    />
                                    <circle
                                        cx="64"
                                        cy="64"
                                        r="60"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        strokeDasharray={377}
                                        strokeDashoffset={377 - (377 * progress) / 100}
                                        className="text-accent-500 transition-all duration-300 ease-out"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-2xl font-bold">{progress}%</span>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-semibold text-white mb-2">Forging Your Planner</h3>
                                <p className="text-gray-400 animate-pulse">{statusMessage}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center space-y-6 max-w-lg">
                            <div className="w-24 h-24 bg-accent-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-accent-500/20">
                                <Layout className="w-12 h-12 text-accent-500" />
                            </div>
                            <h2 className="text-3xl font-bold text-white">Ready to Create</h2>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                Configure your ideal digital planner using the sidebar.
                                Select your device, orientation, and preferences to generate a perfectly optimized PDF.
                            </p>

                            <div className="grid grid-cols-2 gap-4 mt-8">
                                <div className="p-4 rounded-xl bg-galaxy-800 border border-white/5">
                                    <div className="text-sm text-gray-500 mb-1">Target Device</div>
                                    <div className="font-semibold text-blue-300 capitalize">{config.device.replace('-', ' ')}</div>
                                </div>
                                <div className="p-4 rounded-xl bg-galaxy-800 border border-white/5">
                                    <div className="text-sm text-gray-500 mb-1">Orientation</div>
                                    <div className="font-semibold text-blue-300 capitalize">{config.orientation}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PlannerConfigurator;
