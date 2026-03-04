import React, { useEffect, useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  Moon,
  Sun,
  Monitor,
  Smartphone,
  Eye,
  Zap,
  Palette,
} from 'lucide-react';

type ThemeMode = 'light' | 'dark' | 'auto';
type ThemeVariant = 'default' | 'oled' | 'eye-comfort' | 'high-contrast';

interface ThemeOptions {
  mode: ThemeMode;
  variant: ThemeVariant;
  reducedMotion: boolean;
  reducedSaturation: boolean;
  monochromatic: boolean;
}

export function ThemeSelector() {
  const [theme, setTheme] = useState<ThemeOptions>(() => {
    const saved = localStorage.getItem('theme-options');
    return saved
      ? JSON.parse(saved)
      : {
          mode: 'auto',
          variant: 'default',
          reducedMotion: false,
          reducedSaturation: false,
          monochromatic: false,
        };
  });

  useEffect(() => {
    localStorage.setItem('theme-options', JSON.stringify(theme));
    applyTheme(theme);
  }, [theme]);

  const applyTheme = (options: ThemeOptions) => {
    const html = document.documentElement;

    // Remove all theme classes
    html.classList.remove('light', 'dark', 'oled', 'eye-comfort', 'high-contrast', 'reduced-saturation', 'monochromatic');

    // Apply mode
    if (options.mode === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      html.classList.toggle('dark', prefersDark);
    } else {
      html.classList.toggle('dark', options.mode === 'dark');
    }

    // Apply variant
    if (options.variant !== 'default') {
      html.classList.add(options.variant);
    }

    // Apply accessibility options
    if (options.reducedMotion) {
      html.classList.add('reduced-motion');
    }
    if (options.reducedSaturation) {
      html.classList.add('reduced-saturation');
    }
    if (options.monochromatic) {
      html.classList.add('monochromatic');
    }
  };

  const getModeIcon = () => {
    switch (theme.mode) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getVariantLabel = () => {
    switch (theme.variant) {
      case 'oled':
        return 'OLED';
      case 'eye-comfort':
        return 'Eye Comfort';
      case 'high-contrast':
        return 'High Contrast';
      default:
        return 'Default';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          title="Theme Settings"
        >
          {getModeIcon()}
          <span className="hidden sm:inline text-xs">{getVariantLabel()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Theme Mode */}
        <div className="px-2 py-1.5">
          <p className="text-sm font-semibold">Theme Mode</p>
        </div>
        <DropdownMenuRadioGroup
          value={theme.mode}
          onValueChange={(mode) =>
            setTheme({ ...theme, mode: mode as ThemeMode })
          }
        >
          <DropdownMenuRadioItem value="light">
            <Sun className="h-4 w-4 mr-2" />
            Light
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            <Moon className="h-4 w-4 mr-2" />
            Dark
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="auto">
            <Monitor className="h-4 w-4 mr-2" />
            Auto (System)
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        {/* Theme Variant */}
        <div className="px-2 py-1.5">
          <p className="text-sm font-semibold">Variant</p>
        </div>
        <DropdownMenuRadioGroup
          value={theme.variant}
          onValueChange={(variant) =>
            setTheme({ ...theme, variant: variant as ThemeVariant })
          }
        >
          <DropdownMenuRadioItem value="default">
            <Palette className="h-4 w-4 mr-2" />
            Default
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="oled">
            <Smartphone className="h-4 w-4 mr-2" />
            OLED (Power Save)
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="eye-comfort">
            <Eye className="h-4 w-4 mr-2" />
            Eye Comfort
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="high-contrast">
            <Zap className="h-4 w-4 mr-2" />
            High Contrast
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>

        <DropdownMenuSeparator />

        {/* Accessibility Options */}
        <div className="px-2 py-1.5">
          <p className="text-sm font-semibold">Accessibility</p>
        </div>
        <DropdownMenuCheckboxItem
          checked={theme.reducedMotion}
          onCheckedChange={(checked) =>
            setTheme({ ...theme, reducedMotion: checked })
          }
        >
          Reduce Motion
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={theme.reducedSaturation}
          onCheckedChange={(checked) =>
            setTheme({ ...theme, reducedSaturation: checked })
          }
        >
          Reduce Saturation
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={theme.monochromatic}
          onCheckedChange={(checked) =>
            setTheme({ ...theme, monochromatic: checked })
          }
        >
          Monochromatic
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
