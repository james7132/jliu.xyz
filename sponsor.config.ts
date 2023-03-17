/* eslint-disable @typescript-eslint/no-unused-vars */
import { defineConfig, presets } from "sponsorkit";

export default defineConfig({
  formats: ['svg'],
  tiers: [
    {
      title: "Sponsors",
      preset: presets.small,
    },
    {
      title: "Bronze Sponsors",
      monthlyDollars: 100,
      preset: presets.medium,
    },
    {
      title: "Silver Sponsors",
      monthlyDollars: 200,
      preset: presets.large,
    },
    {
      title: "Gold Sponsors",
      monthlyDollars: 500,
      preset: presets.large,
    },
    {
      title: "Platinum Sponsors",
      monthlyDollars: 1000,
      preset: presets.xl,
    },
    {
      title: "Diamond Sponsors",
      monthlyDollars: 4000,
      preset: presets.xl,
    },
  ],
});
