import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle } from 'lucide-react';
import { isLanguage, translate, DEFAULT_LANGUAGE } from '../i18n';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const stored = (typeof window !== 'undefined') ? window.localStorage.getItem('language') : null;
      const lang = isLanguage(stored) ? stored : DEFAULT_LANGUAGE;
      const t = (key: string) => translate(key, lang);

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <Card className="max-w-md w-full bg-card border-border">
            <CardHeader className="text-center">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <CardTitle>{t('errorBoundary.title')}</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-muted-foreground">
                {t('errorBoundary.description')}
              </p>
              <Button
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
              >
                {t('errorBoundary.reload')}
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
