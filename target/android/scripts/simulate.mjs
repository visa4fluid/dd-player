import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const nativeDir = resolve(appRoot, 'native');
const gradlew = resolve(nativeDir, 'gradlew');
const androidHome = process.env.ANDROID_HOME ?? `${process.env.HOME}/Android/Sdk`;
const adb = resolve(androidHome, 'platform-tools/adb');
const appId = 'com.fluidplayer.app';
const home = process.env.HOME ?? '';
const jdk17 = resolve(home, 'Program/jdk-17');
const javaHome = existsSync(resolve(jdk17, 'bin/javac'))
  ? jdk17
  : process.env.JAVA_HOME || resolve(home, 'Program/android-studio/jbr');

if (!existsSync(gradlew)) {
  console.error('Missing Gradle wrapper at target/android/native/gradlew');
  process.exit(1);
}

if (!existsSync(adb)) {
  console.error('adb not found. Set ANDROID_HOME to the Android SDK.');
  process.exit(1);
}

chmodSync(gradlew, 0o755);

const devices = spawnSync(adb, ['devices'], { encoding: 'utf8' });
if (devices.status !== 0 || !/emulator-\d+\s+device/.test(devices.stdout ?? '')) {
  console.error('Nessun emulatore in stato device. Avvia prima:');
  console.error('  emulator -avd Flud_HD_Tv -gpu host');
  process.exit(1);
}

const gradle = spawnSync(gradlew, ['installDebug'], {
  cwd: nativeDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    ANDROID_HOME: androidHome,
    JAVA_HOME: javaHome,
  },
});
if (gradle.status !== 0) {
  process.exit(gradle.status ?? 1);
}

const launch = spawnSync(
  adb,
  ['shell', 'am', 'start', '-n', `${appId}/.MainActivity`],
  { stdio: 'inherit' },
);
if (launch.status !== 0) {
  process.exit(launch.status ?? 1);
}

console.log('Fluid Player avviato sull’emulatore (HelloWorld nel WebView).');
