'use client';

import { useFinanceStore } from '@/store/useFinanceStore';
import { clsx } from 'clsx';

export function TutorialOverlay() {
    const { tutorialStep, setTutorialStep } = useFinanceStore();

    if (tutorialStep === 0) return null;

    const messages = {
        1: { title: "Bienvenue dans ta planif' !", text: "Commence avec ton solde de compte aujourd'hui", buttonText: "Suivant", showSkip: false },
        2: { title: "Tes Recettes", text: "Ajoute une recette qui revient tous les mois, indique le montant par mois", buttonText: "Suivant", showSkip: true },
        3: { title: "Tes Dépenses", text: "Une dépense qui revient tous les mois, indique le montant par mois", buttonText: "Suivant", showSkip: true },
        4: { title: "Opérations Ponctuelles", text: "Clique sur un des emplacements pour ajouter une grosse recette ou dépense ponctuelle prévue pour un des mois qui viennent", buttonText: "Suivant", showSkip: false },
        5: { title: "Bravo !", text: "Tu es prêt à maîtriser tes finances. C'est à toi de jouer !", buttonText: "Continue...", showSkip: false }
    };

    const stepInfo = messages[tutorialStep as keyof typeof messages];

    // Si l'étape n'existe pas, on reset
    if (!stepInfo) {
        setTutorialStep(0);
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center">
            {/* Backdrop grisé */}
            <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-[2px] pointer-events-auto" />

            {/* Pop-up centrale (ou localisée) */}
            <div className={clsx(
                "absolute bg-white rounded-3xl p-6 shadow-premium max-w-sm pointer-events-auto flex flex-col space-y-4 text-center z-[100] animate-in zoom-in-95 duration-300",
                // Pour l'étape 5, on centre sur l'écran. Sinon on la met un peu en bas pour ne pas cacher le top.
                tutorialStep === 5 ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" : "bottom-12 left-1/2 -translate-x-1/2"
            )}>
                <h3 className="font-black italic text-xl text-zinc-900 leading-none">{stepInfo.title}</h3>
                <p className="text-sm font-bold text-zinc-500">{stepInfo.text}</p>
                <div className="flex space-x-2 pt-2">
                    {stepInfo.showSkip && (
                        <button
                            onClick={() => setTutorialStep(tutorialStep + 1)}
                            className="flex-1 py-3 bg-zinc-100 text-zinc-400 font-bold rounded-2xl text-xs hover:bg-zinc-200 transition-colors"
                        >
                            Passer
                        </button>
                    )}
                    <button
                        onClick={() => setTutorialStep(tutorialStep === 5 ? 0 : tutorialStep + 1)}
                        className="flex-1 py-3 bg-zinc-900 text-white font-bold rounded-2xl text-xs shadow-premium hover:scale-95 transition-all"
                    >
                        {stepInfo.buttonText}
                    </button>
                </div>
            </div>
        </div>
    );
}
