import Color from 'color';

export const applyDynamicTheme = ({
  primaryColorHex,
  secondaryColorHex,
  tertiaryColorHex,
  backgroundColorHex,
  textColorHex
}: any) => {
    if (!primaryColorHex && !secondaryColorHex && !tertiaryColorHex && !backgroundColorHex && !textColorHex) return;

    try {
        const root = document.documentElement;

        const setPalette = (name: string, hex: string) => {
            if (!hex) return;
            const c = Color(hex);
            root.style.setProperty(`--chakra-colors-${name}-50`, c.lighten(0.9).hex());
            root.style.setProperty(`--chakra-colors-${name}-100`, c.lighten(0.8).hex());
            root.style.setProperty(`--chakra-colors-${name}-200`, c.lighten(0.6).hex());
            root.style.setProperty(`--chakra-colors-${name}-300`, c.lighten(0.4).hex());
            root.style.setProperty(`--chakra-colors-${name}-400`, c.lighten(0.2).hex());
            root.style.setProperty(`--chakra-colors-${name}-500`, c.hex());
            root.style.setProperty(`--chakra-colors-${name}-600`, c.darken(0.2).hex());
            root.style.setProperty(`--chakra-colors-${name}-700`, c.darken(0.4).hex());
            root.style.setProperty(`--chakra-colors-${name}-800`, c.darken(0.6).hex());
            root.style.setProperty(`--chakra-colors-${name}-900`, c.darken(0.8).hex());
            root.style.setProperty(`--${name}-color`, c.hex());
            root.style.setProperty(`--${name}-rgb`, c.rgb().array().join(', '));
        };

        if (primaryColorHex) setPalette('brand', primaryColorHex);
        if (secondaryColorHex) setPalette('secondary', secondaryColorHex);
        if (tertiaryColorHex) setPalette('tertiary', tertiaryColorHex);
        
        if (backgroundColorHex) {
            root.style.setProperty('--chakra-colors-bg-main', backgroundColorHex);
            root.style.setProperty('--chakra-colors-chakra-body-bg', backgroundColorHex);
        }
        
        if (textColorHex) {
            root.style.setProperty('--chakra-colors-text-main', textColorHex);
            root.style.setProperty('--chakra-colors-chakra-body-text', textColorHex);
        }

    } catch (e) {
        console.error("Error applying dynamic theme:", e);
    }
};

export const preApplyThemeFromStorage = () => {
    try {
        const storedActiveInstDataStr = localStorage.getItem('activeInstitutionData');
        const userStr = localStorage.getItem('user');
        
        let activeInst = null;
        
        if (userStr) {
            const user = JSON.parse(userStr);
            const userInsts = user.myInstitutions || [];
            const storedId = localStorage.getItem('activeInstitutionId');
            if (storedId) {
                activeInst = userInsts.find((i: any) => i.id === parseInt(storedId));
            }
            if (!activeInst && userInsts.length > 0) {
                 activeInst = userInsts.find((i: any) => i.id === user.fk_id_institucion) || userInsts[0];
            }
        }
        
        if (!activeInst && storedActiveInstDataStr) {
            activeInst = JSON.parse(storedActiveInstDataStr);
        }
        
        if (activeInst && activeInst.theme) {
            let pColor = activeInst.theme.primaryColor;
            if (pColor && pColor.includes('var(')) pColor = '#3182CE'; // sanitize

            applyDynamicTheme({
                primaryColorHex: pColor,
                secondaryColorHex: activeInst.theme.secondaryColor,
                tertiaryColorHex: activeInst.theme.tertiaryColor,
                backgroundColorHex: activeInst.theme.backgroundColor,
                textColorHex: activeInst.theme.textColor
            });
        }
    } catch(e) {
        console.error('Error pre-applying theme:', e);
    }
};
