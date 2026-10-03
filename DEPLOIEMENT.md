# Déploiement de Surprise ♥️ (depuis un téléphone, sans PC)

Tout se fait dans le navigateur Android : **GitHub** (qui compile l'APK) et **Render** (le serveur).

> Astuce : dans Chrome, menu ⋮ > **Version pour ordinateur** sur GitHub et Render. Tous les menus y sont disponibles.

## 0. Ce qu'il vous faut
- Un compte **GitHub** et un compte **Render** (render.com)
- Le fichier **Surprise.zip**
- Les 2 fichiers **unpack.yml** et **build-apk.yml** (dossier `workflows`)

---

## 1. Créer le dépôt et importer le projet

1. Sur github.com : **+** > **New repository**. Nom : `surprise`, **Public**, cochez **Add a README file**, puis **Create repository**.
2. **Add file** > **Create new file**.
   - Nom : `.github/workflows/unpack.yml` (taper les `/` crée les dossiers)
   - Collez tout le contenu du fichier `unpack.yml`, puis **Commit changes**.
3. Recommencez avec `.github/workflows/build-apk.yml` et le contenu de `build-apk.yml`.
4. **Add file** > **Upload files** > choisissez `Surprise.zip` (à la racine du dépôt) > **Commit changes**.
5. Onglet **Actions** > **Importer le projet** > **Run workflow**. Si GitHub propose d'activer les workflows, acceptez.
6. Après environ 30 secondes, revenez sur l'onglet **Code** : vous voyez `app`, `server`, `render.yaml`, etc. Le zip a disparu, c'est normal.

> Si l'étape 5 échoue avec une erreur de permission : **Settings > Actions > General > Workflow permissions > Read and write permissions**, puis relancez.

---

## 2. Déployer le serveur sur Render

### Méthode rapide (Blueprint)
1. Sur render.com : **New +** > **Blueprint**.
2. Connectez GitHub et choisissez le dépôt `surprise`.
3. Render lit `render.yaml` et prépare le service web **surprise-api** et la base **surprise-db** (plan *Free*).
4. **Apply**, puis attendez le statut **Live**.
5. Notez l'URL du service, par exemple `https://surprise-api-xxxx.onrender.com`.

### Méthode manuelle (si le Blueprint pose problème)
1. **New +** > **PostgreSQL** : nom `surprise-db`, plan **Free**. Copiez l'**Internal Database URL**.
2. **New +** > **Web Service** : choisissez le dépôt, puis :
   - **Root Directory** : `server`
   - **Build Command** : `npm install`
   - **Start Command** : `node server.js`
   - **Instance Type** : Free
3. Dans **Environment**, ajoutez `DATABASE_URL` avec l'URL copiée.
4. **Create Web Service**.

### Vérifier
Ouvrez `https://VOTRE-SERVICE.onrender.com/health` dans le navigateur : il doit afficher `ok`.
Le premier appel peut prendre 30 à 60 secondes (le service gratuit se réveille).

---

## 3. Compiler l'APK avec GitHub Actions

1. Dans le dépôt : **Settings** > **Secrets and variables** > **Actions** > onglet **Variables** > **New repository variable**.
   - Name : `API_URL`
   - Value : l'URL de votre service Render, sans `/` à la fin
2. Onglet **Actions** > **Construire l'APK** > **Run workflow**. Comptez 4 à 8 minutes.
3. Quand c'est ✅ : sur la page du dépôt, ouvrez **Releases** (colonne de droite, ou menu en version ordinateur) > dernière release > téléchargez **app-debug.apk**.
   - Autre possibilité : ouvrez l'exécution dans **Actions**, section **Artifacts**, **Surprise-apk** (téléchargé en zip).
4. Ouvrez l'APK. Android demande d'autoriser l'installation depuis votre navigateur. Si Play Protect avertit, choisissez **Installer quand même**.

> Chaque compilation signe l'APK avec une clé de test différente. Pour installer une nouvelle version, **désinstallez d'abord l'ancienne** (l'appli ne garde aucune donnée en local, vous ne perdez rien).

---

## 4. Tester de bout en bout

1. Téléphone A : autorisez la localisation, activez le GPS, **Cacher une surprise**, touchez la carte, prenez les 3 photos, écrivez l'indice, **FAIT**, notez le code à 14 chiffres.
2. Téléphone B (ou le même) : **Trouver une surprise**, saisissez le code, suivez le chemin.
3. À moins de 30 m de l'endroit, les photos, l'indice et le message s'affichent.

---

## 5. Limites du plan gratuit de Render

À vérifier sur render.com, les conditions peuvent changer.

| Sujet | Ce qui se passe | Solution |
|---|---|---|
| Service qui s'endort | Après ~15 min sans requête, le 1er appel prend 30-60 s | Normal ; l'appli attend jusqu'à 60 s. Un service de « ping » (ex. UptimeRobot sur `/health`, toutes les 5 min) évite l'endormissement |
| Base gratuite temporaire | La base PostgreSQL gratuite de Render expire après ~30 jours | Plan payant, ou base gratuite externe (ex. **Neon**) |

### Utiliser Neon au lieu de la base Render
1. Créez un projet sur neon.tech et copiez la *connection string* PostgreSQL.
2. Render > votre service > **Environment** : remplacez la valeur de `DATABASE_URL`.
3. **Manual Deploy** > **Deploy latest commit**.

---

## 6. Modifier le projet plus tard (toujours depuis le téléphone)

- Ouvrez un fichier sur GitHub, appuyez sur le crayon ✏️, modifiez, puis **Commit changes**.
- Modifier `server/` : Render redéploie tout seul.
- Modifier `app/` : l'APK est recompilé tout seul et une nouvelle release apparaît.
- Changer `API_URL` : modifiez la variable, puis relancez **Construire l'APK** à la main.

---

## 7. Dépannage

| Problème | Cause probable | Solution |
|---|---|---|
| Le workflow n'apparaît pas dans Actions | Fichier mal placé | Le chemin doit être exactement `.github/workflows/nom.yml` |
| Compilation ❌ | Erreur de code ou de build | Actions > exécution en échec > étape rouge : lisez la dernière erreur et envoyez-la-moi |
| « Connexion impossible » dans l'appli | Serveur endormi ou mauvaise `API_URL` | Ouvrez `/health` dans le navigateur, attendez `ok`, réessayez. Vérifiez la variable puis recompilez |
| « Code introuvable » | Code mal saisi, ou base expirée | Vérifiez les 14 chiffres ; recréez la surprise |
| Erreur 429 | Plus de 30 requêtes/minute depuis la même IP | Attendez une minute |
| Installation impossible (conflit) | Ancienne version signée avec une autre clé | Désinstallez l'ancienne appli |
| Écran « Activez votre GPS » | GPS désactivé ou permission refusée | Activez la localisation, autorisez l'appli |
| Carte vide | Pas d'Internet | Vérifiez la connexion |
| Logs du serveur | — | Render > votre service > **Logs** |

---

## 8. Sécurité

- Une surprise n'est accessible qu'avec son code exact (14 chiffres, soit 100 000 milliards de combinaisons) et aucune route ne permet de les lister.
- Le serveur limite le nombre de requêtes par IP.
- Ne mettez pas d'informations très sensibles dans les messages : ils sont stockés sur le serveur.
