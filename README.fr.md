<p align="center">
  <img src="assets/logo.png" width="400" alt="Claude-SFX">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/claude-sfx"><img src="https://img.shields.io/npm/v/claude-sfx" alt="npm version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="MIT License"></a>
  <a href="https://mcp-tool-shop-org.github.io/claude-sfx/"><img src="https://img.shields.io/badge/Landing_Page-live-blue" alt="Landing Page"></a>
</p>

Retour audio pour [Claude Code](https://docs.anthropic.com/en/docs/claude-code). Chaque appel de fonction, modification de fichier, recherche, envoi Git et exécution d'agent produit un son distinct, synthétisé à partir de formules mathématiques, et non à partir de fichiers audio.

## Démarrage rapide

```bash
npm install -g claude-sfx
cd your-project
claude-sfx init       # install hooks into .claude/settings.json
claude-sfx demo       # hear all 7 verbs
```

C'est tout. Claude Code émettra désormais des sons pendant son fonctionnement.

## Pourquoi un retour audio ?

Lorsqu'un agent d'IA lit, écrit, effectue des recherches et déploie des éléments en votre nom, vous perdez de la visibilité. Vous ne voyez qu'un texte défiler. Le retour audio rétablit la conscience :

- **Accessibilité** : écoutez les changements d'état, les erreurs et les confirmations sans avoir à surveiller le terminal.
- **Fluidité** : sachez si un test a réussi ou si un envoi a été effectué, sans avoir à changer de contexte.
- **Présence** : l'agent vous semble être un collaborateur, et non une boîte noire.

## Les 7 verbes

Chaque action de Claude Code correspond à l'un des 7 verbes principaux. Les modificateurs (état, portée, direction) modifient le son sans rompre la cohérence.

| Verb | Déclencheurs | Sound |
|---|---|---|
| **Réception** | `Lecture`, `WebFetch`, `WebSearch` | Montée douce d'une onde sinusoïdale : quelque chose arrive. |
| **Transformation** | `Edit` | Impulsion texturée en modulation de fréquence : remodelage. |
| **Enregistrement** | `Écriture`, `NotebookEdit`, `git commit` | Son de timbre net : scellé. |
| **Navigation** | `Grep`, `Glob` | Écho sonar : analyse. |
| **Exécution** | `Bash`, `npm test`, `tsc` | Explosion de bruit + tonalité : action mécanique. |
| **Déplacement** | `mv`, `cp`, lancement de sous-agent. | Sifflement de vent : déplacement de l'air. |
| **Synchronisation** | `git push`, `git pull` | Sifflement spectaculaire + ancre tonale. |

### Modificateurs

```bash
claude-sfx play navigate --status ok      # bright ping (octave harmonic)
claude-sfx play navigate --status err     # low detuned ping (dissonance)
claude-sfx play navigate --status warn    # tremolo ping
claude-sfx play sync --direction up       # rising whoosh (push)
claude-sfx play sync --direction down     # falling whoosh (pull)
claude-sfx play intake --scope remote     # longer tail (distance feel)
```

### Détection intelligente de Bash

Le gestionnaire de hooks analyse les commandes Bash pour choisir le son approprié :

| Commande Bash | Verb | État |
|---|---|---|
| `git push` | synchronisation (montée) | à partir du code de sortie |
| `git pull` | synchronisation (descente) | à partir du code de sortie |
| `npm test`, `pytest` | exécution | à partir du code de sortie |
| `tsc`, `npm run build` | exécution | à partir du code de sortie |
| `mv`, `cp` | move | — |
| `rm` | move | warn |
| tout le reste | exécution | à partir du code de sortie |

## Profils

Palettes de sons qui modifient l'ensemble du comportement avec un seul paramètre.

| Profil | Comportement |
|---|---|
| **minimal** (par défaut) | Tons en onde sinusoïdale : subtil, professionnel, pour un usage quotidien. |
| **rétro** | Chirps en onde carrée 8 bits : amusant mais contrôlé. |

```bash
claude-sfx demo --profile retro           # hear retro palette
claude-sfx preview minimal                # audition all sounds + modifiers
claude-sfx config set profile retro       # change default globally
claude-sfx config repo retro              # use retro in current directory only
```

### Profils personnalisés

Copiez `profiles/minimal.json`, modifiez les paramètres de synthèse, puis chargez-le :

```bash
claude-sfx play navigate --profile ./my-profile.json
```

Chaque nombre dans le fichier JSON correspond directement au moteur de synthèse : forme d'onde, fréquence, durée, enveloppe (ADSR), profondeur de modulation de fréquence, bande passante, gain.

## Anti-nuisances

Ce qui distingue un produit d'un jouet.

| Fonctionnalité | Comportement |
|---|---|
| **Debounce** | Même verbe dans un délai de 200 ms → un seul son. |
| **Rate limit** | Maximum de 8 sons par fenêtre de 10 secondes. |
| **Quiet hours** | Tous les sons sont supprimés pendant les heures configurées. |
| **Mute** | Activation instantanée, persiste après le redémarrage de la session. |
| **Volume** | Contrôle du gain de 0 à 100. |
| **Per-verb disable** | Désactivez les verbes spécifiques que vous ne souhaitez pas utiliser. |

```bash
claude-sfx mute                            # instant silence
claude-sfx unmute
claude-sfx volume 40                       # quieter
claude-sfx config set quiet-start 22:00    # quiet after 10pm
claude-sfx config set quiet-end 07:00      # until 7am
claude-sfx disable navigate                # no more search pings
claude-sfx enable navigate                 # bring it back
```

## Son ambiant (opérations de longue durée)

Pour les commandes qui prennent du temps (compilations, déploiements, suites de tests volumineuses) :

```bash
claude-sfx ambient-start     # low drone fades in
# ... operation runs ...
claude-sfx ambient-resolve   # drone stops, resolution stinger plays
claude-sfx ambient-stop      # stop drone silently (no stinger)
```

## Sons de session

```bash
claude-sfx session-start     # two-note ascending chime (boot)
claude-sfx session-end       # two-note descending chime (closure)
```

## Toutes les commandes

```
Setup:
  init                            Install hooks into .claude/settings.json
  uninstall                       Remove hooks

Playback:
  play <verb> [options]           Play a sound (goes through guard)
  demo [--profile <name>]         Play all 7 verbs
  preview [profile]               Audition all sounds in a profile
  session-start / session-end     Chimes
  ambient-start / ambient-resolve / ambient-stop

Config:
  mute / unmute                   Toggle all sounds
  volume [0-100]                  Get or set volume
  config                          Print current config
  config set <key> <value>        Set a value
  config reset                    Reset to defaults
  config repo <profile|clear>     Per-directory profile override
  disable / enable <verb>         Toggle specific verbs
  export [dir] [--profile]        Export all sounds as .wav files
```

## Fonctionnement

Aucun fichier audio. Chaque son est synthétisé en temps réel à partir de formules mathématiques :

- **Oscillateurs** — sinusoïdale, carrée, en dents de scie, triangulaire, bruit blanc.
- **Enveloppes ADSR** — attaque, décroissance, sustain, relâchement.
- **Synthèse FM** — modulation de fréquence pour créer des textures.
- **Filtre à état variable** — bruit filtré en bande passante pour créer des effets de "whoosh".
- **Balayages de fréquence** — interpolation linéaire pour créer du mouvement.
- **Limiteur de volume** — compression "soft-knee", seuil maximum.

L'ensemble du package comprend environ 2 800 lignes de code TypeScript et ne dépend d'aucune bibliothèque externe pour la production. Les sons sont générés sous forme de tampons PCM, encodés en format WAV en mémoire, et lus via le lecteur audio natif du système d'exploitation (PowerShell sur Windows, afplay sur macOS, aplay sur Linux).

## Prérequis :

- Node.js 18 ou supérieur.
- Claude Code.
- Sortie audio du système (haut-parleurs ou casque).

## Licence :

[MIT](LICENSE)
