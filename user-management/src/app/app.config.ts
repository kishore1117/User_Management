import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { provideHttpClient ,withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { importProvidersFrom } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { providePrimeNG } from 'primeng/config';
import Lara from '@primeuix/themes/lara';
import { ReactiveFormsModule } from '@angular/forms';
import { MegaMenuModule } from 'primeng/megamenu';   // ✅ Add this
import { ButtonModule } from 'primeng/button';       // optional if used
import { AvatarModule } from 'primeng/avatar';       // optional if used
import { ToastModule } from 'primeng/toast';         // optional if used
import { CardModule } from 'primeng/card';   
import { authInterceptor } from './services/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(appRoutes),
    provideHttpClient(),
    provideAnimations(),
    importProvidersFrom(FormsModule,
    ReactiveFormsModule,
    MegaMenuModule,   // ✅ Add this
    ButtonModule,     // optional if used
    AvatarModule,    // optional if used
    ToastModule,     // optional if used
    CardModule      // optional if used
    ),
        providePrimeNG({
      theme: {
        preset: Lara
      }
    }),
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};
