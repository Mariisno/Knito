
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react';
  import tailwindcss from '@tailwindcss/vite';
  import path from 'path';
  import fs from 'node:fs';

  function versionJsonPlugin() {
    function resolveLatestVersion(): string {
      const fragDir = path.resolve(__dirname, 'src/data/changelog-fragments');
      const versions: string[] = [];
      try {
        const files = fs.readdirSync(fragDir).filter(f => f.endsWith('.ts'));
        for (const file of files) {
          const src = fs.readFileSync(path.join(fragDir, file), 'utf8');
          const m = src.match(/version:\s*['"]([^'"]+)['"]/);
          if (m) versions.push(m[1]);
        }
      } catch { /* ignore if dir missing */ }
      const changelogSrc = fs.readFileSync(
        path.resolve(__dirname, 'src/data/changelog.ts'), 'utf8'
      );
      for (const m of changelogSrc.matchAll(/version:\s*['"]([^'"]+)['"]/g)) {
        versions.push(m[1]);
      }
      versions.sort((a, b) => {
        const pa = a.split('.').map(Number);
        const pb = b.split('.').map(Number);
        for (let i = 0; i < 3; i++) if (pb[i] !== pa[i]) return pb[i] - pa[i];
        return 0;
      });
      return versions[0] ?? '0.0.0';
    }

    return {
      name: 'knito-version-json',
      configureServer(server: any) {
        server.middlewares.use('/version.json', (_req: any, res: any) => {
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ version: resolveLatestVersion() }));
        });
      },
      closeBundle() {
        const outDir = path.resolve(__dirname, 'build');
        fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(
          path.join(outDir, 'version.json'),
          JSON.stringify({ version: resolveLatestVersion() }, null, 2)
        );
      },
    };
  }

  export default defineConfig({
    plugins: [react(), tailwindcss(), versionJsonPlugin()],
    publicDir: 'src/public',
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
      alias: {
        'vaul@1.1.2': 'vaul',
        'sonner@2.0.3': 'sonner',
        'recharts@2.15.2': 'recharts',
        'react-resizable-panels@2.1.7': 'react-resizable-panels',
        'react-hook-form@7.55.0': 'react-hook-form',
        'react-day-picker@8.10.1': 'react-day-picker',
        'lucide-react@0.487.0': 'lucide-react',
        'input-otp@1.4.2': 'input-otp',
        'embla-carousel-react@8.6.0': 'embla-carousel-react',
        'cmdk@1.1.1': 'cmdk',
        'class-variance-authority@0.7.1': 'class-variance-authority',
        '@radix-ui/react-tooltip@1.1.8': '@radix-ui/react-tooltip',
        '@radix-ui/react-toggle@1.1.2': '@radix-ui/react-toggle',
        '@radix-ui/react-toggle-group@1.1.2': '@radix-ui/react-toggle-group',
        '@radix-ui/react-switch@1.1.3': '@radix-ui/react-switch',
        '@radix-ui/react-slot@1.1.2': '@radix-ui/react-slot',
        '@radix-ui/react-separator@1.1.2': '@radix-ui/react-separator',
        '@radix-ui/react-select@2.1.6': '@radix-ui/react-select',
        '@radix-ui/react-scroll-area@1.2.3': '@radix-ui/react-scroll-area',
        '@radix-ui/react-radio-group@1.2.3': '@radix-ui/react-radio-group',
        '@radix-ui/react-popover@1.1.6': '@radix-ui/react-popover',
        '@radix-ui/react-navigation-menu@1.2.5': '@radix-ui/react-navigation-menu',
        '@radix-ui/react-menubar@1.1.6': '@radix-ui/react-menubar',
        '@radix-ui/react-label@2.1.2': '@radix-ui/react-label',
        '@radix-ui/react-hover-card@1.1.6': '@radix-ui/react-hover-card',
        '@radix-ui/react-dropdown-menu@2.1.6': '@radix-ui/react-dropdown-menu',
        '@radix-ui/react-dialog@1.1.6': '@radix-ui/react-dialog',
        '@radix-ui/react-context-menu@2.2.6': '@radix-ui/react-context-menu',
        '@radix-ui/react-collapsible@1.1.3': '@radix-ui/react-collapsible',
        '@radix-ui/react-checkbox@1.1.4': '@radix-ui/react-checkbox',
        '@radix-ui/react-avatar@1.1.3': '@radix-ui/react-avatar',
        '@radix-ui/react-aspect-ratio@1.1.2': '@radix-ui/react-aspect-ratio',
        '@radix-ui/react-accordion@1.2.3': '@radix-ui/react-accordion',
        '@jsr/supabase__supabase-js@2.49.8': '@jsr/supabase__supabase-js',
        '@jsr/supabase__supabase-js@2': '@jsr/supabase__supabase-js',
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'esnext',
      outDir: 'build',
    },
    server: {
      port: 3000,
      open: true,
    },
  });