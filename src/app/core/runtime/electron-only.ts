declare global {
  interface Window {
    chocoboElectron?: boolean;
    electronAPI?: unknown;
  }
}

export function isElectronRuntime(win: Window = window): boolean {
  const userAgent = win.navigator.userAgent.toLowerCase();

  return userAgent.includes(' electron/')
    || win.chocoboElectron === true
    || Boolean(win.electronAPI);
}

export function renderBrowserBlocked(documentRef: Document = document): void {
  documentRef.body.replaceChildren();

  const main = documentRef.createElement('main');
  main.className = 'runtime-block';

  const section = documentRef.createElement('section');
  section.className = 'runtime-block__panel';
  section.setAttribute('aria-labelledby', 'runtime-block-title');

  const icon = documentRef.createElement('span');
  icon.className = 'runtime-block__icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = 'C';

  const brand = documentRef.createElement('p');
  brand.textContent = 'Chocobo';

  const title = documentRef.createElement('h1');
  title.id = 'runtime-block-title';
  title.textContent = 'Abra pelo aplicativo desktop';

  const message = documentRef.createElement('span');
  message.textContent = 'Este sistema foi bloqueado para navegadores comuns e deve ser executado pelo Electron.';

  section.append(icon, brand, title, message);
  main.appendChild(section);
  documentRef.body.appendChild(main);

  const style = documentRef.createElement('style');
  style.textContent = `
    :root {
      color-scheme: light dark;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    body {
      margin: 0;
      background: #0e1623;
      color: #edf2f7;
    }

    .runtime-block {
      display: grid;
      min-height: 100vh;
      place-items: center;
      padding: 1rem;
    }

    .runtime-block__panel {
      display: grid;
      width: min(100%, 28rem);
      gap: 0.7rem;
      border: 1px solid #314155;
      border-radius: 0.65rem;
      background: #182232;
      box-shadow: 0 20px 70px rgba(0, 0, 0, 0.35);
      padding: 1.25rem;
      text-align: center;
    }

    .runtime-block__icon {
      display: grid;
      width: 2.7rem;
      height: 2.7rem;
      place-items: center;
      justify-self: center;
      border-radius: 0.55rem;
      background: linear-gradient(135deg, #0f766e, #f59e0b);
      color: #ffffff;
      font-weight: 900;
    }

    .runtime-block__panel p,
    .runtime-block__panel h1 {
      margin: 0;
    }

    .runtime-block__panel p {
      color: #aab6c7;
      font-size: 0.78rem;
      font-weight: 900;
      text-transform: uppercase;
    }

    .runtime-block__panel h1 {
      font-size: 1.35rem;
      line-height: 1.15;
    }

    .runtime-block__panel span:last-child {
      color: #aab6c7;
      line-height: 1.45;
    }
  `;
  documentRef.head.appendChild(style);
}
