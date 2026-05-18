import { signalStore, withState } from '@ngrx/signals';

type PreferencesState = {
  locale: 'pt-BR';
  activeStoreName: string | null;
};

export const PreferencesStore = signalStore(
  { providedIn: 'root' },
  withState<PreferencesState>({
    locale: 'pt-BR',
    activeStoreName: null
  })
);
