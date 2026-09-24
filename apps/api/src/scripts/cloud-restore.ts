import { env } from "../config/env.js";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import readline from "node:readline";

async function getAvailableBackups(backupDir: string): Promise<string[]> {
  try {
    await fs.mkdir(backupDir, { recursive: true });
    const files = await fs.readdir(backupDir);
    const gzFiles = files.filter(f => f.endsWith(".gz"));

    // Sort by file stats modification time (newest first)
    gzFiles.sort((a, b) => {
      const statA = fsSync.statSync(path.join(backupDir, a));
      const statB = fsSync.statSync(path.join(backupDir, b));
      return statB.mtimeMs - statA.mtimeMs;
    });

    return gzFiles;
  } catch {
    return [];
  }
}

async function promptUser(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function runRestore() {
  const BACKUP_DIR = path.resolve(process.cwd(), "backups");
  let targetBackupFile = process.argv[2];

  const gzFiles = await getAvailableBackups(BACKUP_DIR);

  console.log("==================================================");
  console.log(" 📦 VENDEUR IA — RESTAURATEUR DE BASE DE DONNÉES");
  console.log("==================================================");

  if (gzFiles.length === 0) {
    console.log("⚠️  Aucune sauvegarde locale trouvée dans le dossier ./backups/");
    console.log("💡 Astuce : Exécutez d'abord `pnpm db:backup` pour générer une sauvegarde de votre base MongoDB.");
    process.exit(0);
  }

  const latestBackup = gzFiles[0];
  const latestBackupPath = path.join(BACKUP_DIR, latestBackup);

  console.log(`🕒 Dernière sauvegarde disponible : ${latestBackup}`);

  if (!targetBackupFile) {
    console.log("\n💡 Sauvegardes disponibles :");
    gzFiles.forEach((f, idx) => {
      const filePath = path.join(BACKUP_DIR, f);
      const stats = fsSync.statSync(filePath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      const isLatest = idx === 0 ? " ⭐ [DERNIÈRE]" : "";
      console.log(`  [${idx + 1}] ${f} (${sizeMB} MB)${isLatest}`);
    });

    const answer = await promptUser(`\n👉 Voulez-vous restaurer la dernière sauvegarde (${latestBackup}) ? [Y/n] ou entrez le numéro : `);

    if (answer === "" || answer.toLowerCase() === "y" || answer.toLowerCase() === "oui") {
      targetBackupFile = latestBackupPath;
    } else if (!isNaN(Number(answer))) {
      const idx = Number(answer) - 1;
      if (gzFiles[idx]) {
        targetBackupFile = path.join(BACKUP_DIR, gzFiles[idx]);
      } else {
        console.error("❌ Numéro invalide.");
        process.exit(1);
      }
    } else {
      targetBackupFile = path.resolve(process.cwd(), answer);
    }
  } else {
    targetBackupFile = path.resolve(process.cwd(), targetBackupFile);
  }

  try {
    await fs.access(targetBackupFile);
  } catch {
    console.error(`❌ Fichier de sauvegarde introuvable : ${targetBackupFile}`);
    process.exit(1);
  }

  const mongoUri = env.MONGODB_URI;
  console.log(`\n🔄 Restauration de MongoDB depuis : ${path.basename(targetBackupFile)}`);
  console.log(`🎯 Cible : ${mongoUri.replace(/\/\/.+@/, "//<credentials>@")}`);

  try {
    execSync(`mongorestore --uri="${mongoUri}" --archive="${targetBackupFile}" --gzip --drop`, { stdio: "inherit" });
    console.log("\n✨ Base de données restaurée avec succès !");
  } catch (error) {
    console.error("❌ Échec du processus de restauration :", error);
    process.exit(1);
  }
}

runRestore().then(() => {
  console.log("🎯 Tâche de restauration terminée.");
  process.exit(0);
});
