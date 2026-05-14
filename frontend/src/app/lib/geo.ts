import Country from "country-state-city/lib/country";
import State from "country-state-city/lib/state";

export interface CountryOption {
  name: string;
  isoCode: string;
  phonecode: string;
  flag: string;
}

export const COUNTRY_OPTIONS: CountryOption[] = Country.getAllCountries()
  .map((country) => ({
    name: country.name,
    isoCode: country.isoCode,
    phonecode: country.phonecode,
    flag: country.flag,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

const PHONE_LENGTHS: Record<string, number> = {
  IN: 10,
  US: 10,
  CA: 10,
  GB: 10,
  AU: 9,
  SG: 8,
  AE: 9,
  DE: 11,
  FR: 9,
  IT: 10,
  BR: 11,
  ZA: 9,
  JP: 10,
};

export function getCountryByIso(isoCode: string) {
  return COUNTRY_OPTIONS.find((country) => country.isoCode === isoCode) ?? COUNTRY_OPTIONS[0];
}

export function getPhoneDigitLimit(isoCode: string) {
  return PHONE_LENGTHS[isoCode] ?? 15;
}

export function getStatesForCountry(countryIso: string) {
  return State.getStatesOfCountry(countryIso);
}

export function getCountryName(countryIso: string) {
  return getCountryByIso(countryIso)?.name ?? "";
}

export function getStateName(countryIso: string, stateCode: string) {
  return getStatesForCountry(countryIso).find((state) => state.isoCode === stateCode)?.name ?? "";
}
