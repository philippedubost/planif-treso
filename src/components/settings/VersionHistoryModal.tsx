import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, History, RotateCcw, Box } from 'lucide-react';
import { useFinanceStore } from '@/store/useFinanceStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';

interface VersionHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({ isOpen, onClose }) => {
    const scenarioVersions = useFinanceStore((state) => state.scenarioVersions);
    const restoreVersionAsNewScenario = useFinanceStore((state) => state.restoreVersionAsNewScenario);
    const fetchScenarios = useFinanceStore((state) => state.fetchScenarios);

    const handleRestore = async (version: any) => {
        const confirmMsg = `Êtes-vous sûr de vouloir restaurer la version "${version.name}" en tant que nouveau scénario ?`;
        if (window.confirm(confirmMsg)) {
            const newScenarioId = await restoreVersionAsNewScenario(version);
            if (newScenarioId) {
                await fetchScenarios();
                onClose();
            } else {
                alert("Erreur lors de la restauration du scénario.");
            }
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-zinc-900/20 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-white rounded-3xl shadow-premium overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex flex-col items-center text-center p-6 border-b border-zinc-100 relative">
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 w-10 h-10 rounded-2xl bg-zinc-50 hover:bg-zinc-100 text-zinc-400 hover:text-zinc-900 flex items-center justify-center transition-colors border border-transparent hover:border-zinc-200"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="w-24 h-24 md:w-32 md:h-32 mx-auto relative mb-4">
                                <Image
                                    src="/illustrations/mascot-graph-overview.png"
                                    alt="Mascotte historique"
                                    fill
                                    className="object-contain filter drop-shadow-xl"
                                />
                            </div>
                            <div>
                                <h2 className="text-xl font-black italic text-zinc-900 tracking-tight">Historique du scénario</h2>
                                <p className="text-sm font-medium text-zinc-500">Gérer et restaurer les versions sauvegardées</p>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                            {scenarioVersions.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="w-16 h-16 rounded-3xl bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-4">
                                        <Box className="w-8 h-8 text-zinc-300" />
                                    </div>
                                    <h3 className="text-sm font-bold text-zinc-900 mb-1">Aucune sauvegarde</h3>
                                    <p className="text-xs text-zinc-500 max-w-[250px]">
                                        Les versions de votre scénario apparaîtront ici.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {scenarioVersions.map((version) => (
                                        <div
                                            key={version.id}
                                            className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50 transition-all group"
                                        >
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-zinc-900">{version.name}</span>
                                                <span className="text-xs font-medium text-zinc-500 mt-1">
                                                    {format(new Date(version.created_at || new Date().toISOString()), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                                                </span>
                                            </div>

                                            <button
                                                onClick={() => handleRestore(version)}
                                                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-white border border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300 hover:shadow-sm transition-all sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100"
                                                title="Restaurer comme nouveau scénario"
                                            >
                                                <RotateCcw className="w-3.5 h-3.5" />
                                                <span className="text-xs font-bold">Restaurer</span>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
