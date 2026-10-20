# PhotoDay 📸

Un selfie par jour, partagé avec tes groupes d'amis. À la fin du mois, chaque
personne a son timelapse, avec les yeux alignés d'une photo à l'autre.

Appli iOS + Android en **Expo (React Native) + TypeScript**, backend **Supabase**.

## Fonctionnalités (MVP)

- Connexion par email + mot de passe.
- Selfie du jour avec la caméra frontale, un par jour (on peut le reprendre dans la journée).
- Détection des yeux **sur le téléphone** (Google ML Kit) au moment de la prise de vue ;
  les coordonnées des yeux sont enregistrées avec la photo.
- Groupes d'amis : créer un groupe, inviter avec un code, voir les selfies du jour des membres.
- Timelapse mensuel par personne : chaque photo est déplacée, zoomée et tournée pour que
  les yeux tombent toujours au même endroit, puis lue en boucle.
- Rappel quotidien (notification locale à midi).

## Architecture

```
src/
  app/                  écrans (Expo Router)
    sign-in.tsx         connexion / création de compte (email + mot de passe)
    index.tsx           accueil : selfie du jour + mes groupes
    capture.tsx         caméra, détection des yeux, envoi
    groups/new.tsx      créer / rejoindre un groupe
    groups/[id].tsx     selfies du jour du groupe, invitation
    timelapse/[userId]  timelapse du mois d'une personne
    profile.tsx         nom affiché, rappel, déconnexion
  components/           AlignedFrame, TimelapsePlayer, UI
  lib/
    alignment.ts        maths de l'alignement des yeux (testé)
    faces.ts            détection des yeux (ML Kit)
    api.ts              accès Supabase (tables + stockage)
supabase/migrations/    schéma SQL, règles d'accès (RLS), bucket de stockage
```

Les photos sont dans un bucket privé (`selfies/<user_id>/<YYYY-MM-DD>.jpg`).
Une photo n'est visible que par son auteur et les personnes qui partagent au moins
un groupe avec lui (règles RLS dans la migration).

## Lancer le projet

1. **Supabase** : créer un projet sur [supabase.com](https://supabase.com), puis appliquer
   `supabase/migrations/20261020000000_init.sql` (éditeur SQL ou `supabase db push`).
   Dans *Authentication > Sign In / Providers > Email*, désactiver **Confirm email**
   (sinon Supabase doit envoyer un email de confirmation à chaque inscription).
2. **Variables** : copier `.env.example` en `.env.local` et remplir l'URL et la clé `anon`.
3. **Dépendances** : `npm install`.
4. **Build de développement** (la détection de visage est un module natif, donc Expo Go
   ne suffit pas) :
   - avec EAS, sans Xcode ni Android Studio : `npx eas-cli@latest build --profile development --platform ios|android` ;
   - ou en local : `npm run ios` / `npm run android`.
5. `npm start` puis ouvrir l'appli de dev sur le téléphone.

### Sur iPhone avec un Mac (gratuit, sans compte développeur payant)

1. Installer Xcode (App Store), l'ouvrir une fois, puis `brew install cocoapods`.
2. Xcode > Settings > Accounts : ajouter son identifiant Apple (crée une « Personal Team » gratuite).
3. Brancher l'iPhone en USB, accepter « Faire confiance », puis activer
   Réglages > Confidentialité et sécurité > **Mode développeur** (l'iPhone redémarre).
4. `npx expo run:ios --device` et choisir l'iPhone. Si Xcode demande une équipe de signature :
   ouvrir `ios/PhotoDay.xcworkspace`, onglet *Signing & Capabilities*, choisir la Personal Team
   (et changer le Bundle Identifier s'il est déjà pris).
5. Au premier lancement : Réglages > Général > VPN et gestion de l'appareil > faire confiance au développeur.

Avec un compte gratuit, l'appli expire au bout de 7 jours : relancer l'étape 4.
Les notifications push distantes sont désactivées pour que la signature gratuite fonctionne
(le rappel quotidien est une notification locale, il marche quand même).

Tests et vérification des types : `npm test` et `npm run typecheck`.

## Pistes suivantes

- Export du timelapse en vidéo MP4 (partage Instagram / WhatsApp), par exemple une
  fonction serveur avec ffmpeg déclenchée le 1er du mois.
- Notification « ton timelapse du mois est prêt » et quand un ami poste.
- Option « un selfie par groupe » si on veut choisir à quels groupes envoyer.
