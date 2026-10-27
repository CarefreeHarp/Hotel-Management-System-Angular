import { Directive, HostBinding, Input, numberAttribute } from '@angular/core';

interface ImageVariant {
  src: string;
  width: number;
}
const localImages: Record<string, ImageVariant[]> = {
  '/images/landing-page/hero_lobby.jpg': [
    {
      src: '/images/landing-page/hero_lobby-640.webp',
      width: 640,
    },
    {
      src: '/images/landing-page/hero_lobby-1280.webp',
      width: 1280,
    },
    {
      src: '/images/landing-page/hero_lobby-1600.webp',
      width: 1600,
    },
  ],
  '/images/services/restaurant.jpg': [
    {
      src: '/images/services/restaurant-640.webp',
      width: 640,
    },
    {
      src: '/images/services/restaurant-1280.webp',
      width: 1280,
    },
    {
      src: '/images/services/restaurant-1920.webp',
      width: 1920,
    },
  ],
  '/images/images-utils/social-media/facebook.png': [
    {
      src: '/images/images-utils/social-media/facebook-48.webp',
      width: 48,
    },
    {
      src: '/images/images-utils/social-media/facebook-96.webp',
      width: 96,
    },
  ],
  '/images/images-utils/social-media/instagram-logo.png': [
    {
      src: '/images/images-utils/social-media/instagram-logo-48.webp',
      width: 48,
    },
    {
      src: '/images/images-utils/social-media/instagram-logo-96.webp',
      width: 96,
    },
  ],
  '/images/images-utils/social-media/x.png': [
    {
      src: '/images/images-utils/social-media/x-48.webp',
      width: 48,
    },
    {
      src: '/images/images-utils/social-media/x-96.webp',
      width: 96,
    },
  ],
  '/images/images-utils/social-media/youtube.png': [
    {
      src: '/images/images-utils/social-media/youtube-48.webp',
      width: 48,
    },
    {
      src: '/images/images-utils/social-media/youtube-96.webp',
      width: 96,
    },
  ],
  '/images/images-utils/hotel-identity/logo-transparent.png': [
    {
      src: '/images/images-utils/hotel-identity/logo-transparent-320.webp',
      width: 320,
    },
    {
      src: '/images/images-utils/hotel-identity/logo-transparent-639.webp',
      width: 639,
    },
  ],
};

// Las rutas ya optimizadas también reutilizan las variantes de tamaño de la imagen original.
for (const variants of Object.values(localImages)) {
  for (const variant of variants) {
    localImages[variant.src] = variants;
  }
}

/** Solicita imágenes del tamaño necesario. Reducirlas solo con CSS no reduce la descarga. */
@Directive({ selector: 'img[appImage]' })
export class OptimizedImageDirective {
  @Input() src: string | undefined;
  @Input({ transform: numberAttribute }) imageWidth = 960;
  @HostBinding('attr.loading') @Input() loading: 'lazy' | 'eager' = 'lazy';
  @HostBinding('attr.decoding') readonly decoding = 'async';
  private get variants(): ImageVariant[] | undefined {
    return this.src
      ? localImages[this.src.startsWith('/') ? this.src : '/' + this.src]
      : undefined;
  }
  // Solo Unsplash permite ajustar el tamaño por URL. Las demás fuentes se conservan intactas.
  private unsplash(width: number): string | undefined {
    if (!this.src) {
      return undefined;
    }
    try {
      const url = new URL(this.src);
      if (url.hostname !== 'images.unsplash.com') {
        return undefined;
      }
      url.searchParams.set('auto', 'format');
      url.searchParams.set('w', String(width));
      url.searchParams.set('q', '80');
      return url.toString();
    } catch {
      return undefined;
    }
  }
  @HostBinding('attr.src') get source(): string | undefined {
    const variants = this.variants;
    if (variants) {
      return (
        variants.find((item) => item.width >= this.imageWidth) ??
        variants[variants.length - 1]
      )?.src;
    }
    return this.unsplash(this.imageWidth) ?? this.src;
  }
  @HostBinding('attr.srcset') get sourceSet(): string | undefined {
    if (this.variants) {
      return this.variants
        .map((item) => `${item.src} ${item.width}w`)
        .join(', ');
    }
    if (!this.unsplash(this.imageWidth)) {
      return undefined;
    }
    return [...new Set([320, 640, this.imageWidth, this.imageWidth * 2])]
      .sort((a, b) => a - b)
      .map((width) => `${this.unsplash(width)} ${width}w`)
      .join(', ');
  }
  @HostBinding('attr.sizes') get sizes(): string | undefined {
    return this.sourceSet
      ? `(max-width: ${this.imageWidth}px) 100vw, ${this.imageWidth}px`
      : undefined;
  }
}
