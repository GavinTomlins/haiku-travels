export const site = {
  title: "Haiku-Travels",
  description: "Personal experiences, observations and reflections, expressed through haiku.",
  url: "https://haikutravels.xyz/",
  author: "Gavin Tomlins",
  contactEmail: "gavintomlins@gmail.com",
  license: {
    id: "CC-BY-NC-ND-4.0",
    name: "Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 International",
    short: "CC BY-NC-ND 4.0",
    url: "https://creativecommons.org/licenses/by-nc-nd/4.0/",
  },
  // Poetic forms, keyed as the content front matter spells them; the value is the JSON-LD genre.
  forms: {
    "haiku-traditional": "haiku",
    "haiku-modern": "haiku",
    senryu: "senryu",
    tanka: "tanka",
    haibun: "haibun",
    renku: "renku",
  },
  // The same forms in display order, with the label the pills show.
  formList: [
    { slug: "haiku-traditional", label: "Traditional" },
    { slug: "haiku-modern", label: "Modern" },
    { slug: "senryu", label: "Senryu" },
    { slug: "tanka", label: "Tanka" },
    { slug: "haibun", label: "Haibun" },
    { slug: "renku", label: "Renku" },
  ],
  types: [
    { slug: "travel", label: "Travel" },
    { slug: "food", label: "Food" },
    { slug: "people", label: "People" },
    { slug: "nature", label: "Nature" },
    { slug: "everyday", label: "Everyday" },
  ],
};
