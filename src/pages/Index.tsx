import { Button } from "@/components/ui/button";
import { TranslatorPanel } from "@/components/TranslatorPanel";
import { NeonBubbles } from "@/components/NeonBubbles";
import { Helmet } from "react-helmet-async";
import { SettingsSheet } from "@/components/SettingsSheet";

const Index = () => {
  return (
    <main className="min-h-screen neon-bg relative overflow-hidden">
      <Helmet>
        <title>Traducteur vocal FR ↔ EN | Néon Gaming</title>
        <meta name="description" content="Traducteur vocal en direct FR ↔ EN avec effets néon gaming. Parlez, on transcrit, traduit et lit en temps réel." />
        <link rel="canonical" href={typeof window !== "undefined" ? window.location.href : "/"} />
      </Helmet>
      <NeonBubbles />
      <header className="container py-12 md:py-16">
        <div className="mx-auto max-w-4xl text-center animate-enter">
          <h1 className="font-display text-4xl md:text-6xl font-extrabold tracking-tight mb-4 neon-text">
            Traducteur vocal en direct FR ↔ EN
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Parlez naturellement. Nous transcrivons, traduisons et lisons votre message en temps réel.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button variant="neon" asChild>
              <a href="#live">Démarrer maintenant</a>
            </Button>
            <Button variant="secondary" asChild>
              <a href="#comment">Comment ça marche ?</a>
            </Button>
            <SettingsSheet />
          </div>
        </div>
      </header>

      <section id="live" className="container pb-12 grid gap-6 md:grid-cols-2">
        <TranslatorPanel title="Français → Anglais" sourceLang="fr-FR" targetLang="en-US" />
        <TranslatorPanel title="Anglais → Français" sourceLang="en-US" targetLang="fr-FR" />
      </section>

      <section id="comment" className="container pb-24">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-2xl font-semibold mb-3">Fonctionne avec Discord et autres</h2>
          <p className="text-muted-foreground">
            Laissez cette page ouverte pendant vos appels Discord, jeux ou réunions. Le micro du
            navigateur capte votre voix et lit la traduction dans la langue cible tout en affichant
            des sous-titres.
          </p>
        </div>
      </section>
    </main>
  );
};

export default Index;
