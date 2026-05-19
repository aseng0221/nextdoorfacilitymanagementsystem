declare module 'react-native-country-picker-modal' {
  import React from 'react';

  export interface Country {
    cca2: string;
    callingCode: string[];
    name: string | { [key: string]: string };
  }

  export interface CountryPickerProps {
    countryCode?: string;
    withFilter?: boolean;
    withFlag?: boolean;
    withCallingCode?: boolean;
    withCallingCodeButton?: boolean;
    withAlphaFilter?: boolean;
    onSelect?: (country: Country) => void;
  }

  export default class CountryPicker extends React.Component<CountryPickerProps> {}
}
