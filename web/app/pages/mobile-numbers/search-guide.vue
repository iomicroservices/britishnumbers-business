<script setup lang="ts">
useSeoMeta({
  title: 'Search guide · British Numbers',
  description: 'Find a memorable mobile number by the digits you know, a word on the keypad, or the start, middle, and end you have in mind.'
})

const { shopLink } = useMobileSearchQuery()

const places = [
  {
    title: 'Anywhere',
    description: 'Look through the whole number. Ideal when you remember a run of digits but not where they sit.',
    icon: 'i-lucide-search',
    query: '345678',
    parts: [
      { text: '07700 ' },
      { text: '345678', match: true }
    ]
  },
  {
    title: 'Prefix',
    description: 'Look at the first six digits. Useful when you want a number that opens a certain way.',
    icon: 'i-lucide-arrow-right-from-line',
    query: '074444',
    parts: [
      { text: '074444', match: true },
      { text: ' 123456' }
    ]
  },
  {
    title: 'Ending',
    description: 'Look at the last six digits. Perfect when the ending is the part people should remember.',
    icon: 'i-lucide-arrow-left-from-line',
    query: '123456',
    parts: [
      { text: '07700 ' },
      { text: '123456', match: true }
    ]
  }
]

const patterns = [
  {
    title: 'A run of digits',
    description: 'Type the digits you know. We find numbers that contain them.',
    query: '345678',
    parts: [
      { text: '07700 ' },
      { text: '345678', match: true }
    ]
  },
  {
    title: 'A word',
    description: 'Type a word and we read it like an old phone keypad. hello becomes 43556.',
    query: 'hello',
    parts: [
      { text: '07700 ' },
      { text: '43556', match: true },
      { text: '1' }
    ]
  },
  {
    title: 'Letters and digits together',
    description: 'Mix them in one search. 777a7 is read as 77727, because A sits on the 2 key.',
    query: '777a7',
    parts: [
      { text: '07000 ' },
      { text: '77727', match: true },
      { text: '0' }
    ]
  },
  {
    title: 'Starts with, and includes',
    description: 'A comma splits the start from digits that appear later.',
    query: '079,5050',
    parts: [
      { text: '079', match: true },
      { text: '00 ' },
      { text: '5050', match: true },
      { text: '12' }
    ]
  },
  {
    title: 'Start, middle, and end',
    description: 'Two commas give you three parts: how it starts, what it includes, and how it ends.',
    query: '079,5050,79',
    parts: [
      { text: '079', match: true },
      { text: '12 ' },
      { text: '5050', match: true },
      { text: '79', match: true }
    ]
  },
  {
    title: 'Start and end only',
    description: 'Leave the middle empty when you only care about the opening and the finish.',
    query: '077,,999',
    parts: [
      { text: '077', match: true },
      { text: '00 111' },
      { text: '999', match: true }
    ]
  },
  {
    title: 'Middle and end',
    description: 'Skip the start with a leading comma when you know the rest.',
    query: ',47,2229',
    parts: [
      { text: '079' },
      { text: '47', match: true },
      { text: ' 11' },
      { text: '2229', match: true }
    ]
  },
  {
    title: 'Just the start',
    description: 'A comma after the digits keeps the search on the beginning of the number.',
    query: '07444,',
    parts: [
      { text: '07444', match: true },
      { text: ' 123456' }
    ]
  },
  {
    title: 'Just the middle',
    description: 'A comma before the digits looks for them anywhere, not only at the start.',
    query: ',4444,',
    parts: [
      { text: '07111 ' },
      { text: '4444', match: true },
      { text: '00' }
    ]
  },
  {
    title: 'Just the end',
    description: 'Two commas park the digits at the end of the number.',
    query: ',,9999',
    parts: [
      { text: '07123 45' },
      { text: '9999', match: true }
    ]
  }
]
</script>

<template>
  <div>
    <UPageHero
      title="Find a number that sticks"
      description="Search the digits you remember, a word from the keypad, or the exact start and end you have in mind."
      :links="[{
        label: 'Search numbers',
        to: shopLink,
        size: 'xl',
        trailingIcon: 'i-lucide-arrow-right'
      }]"
    />

    <UPageSection
      headline="Where to look"
      title="Choose the part of the number that matters"
      description="Anywhere is the usual choice. Switch to Prefix or Ending when the opening or the finish is what you want people to remember."
    >
      <UPageGrid>
        <UPageCard
          v-for="place in places"
          :key="place.title"
          :title="place.title"
          :description="place.description"
          :icon="place.icon"
          spotlight
        >
          <template #footer>
            <div class="rounded-lg bg-elevated px-4 py-3">
              <p class="text-xs font-medium text-muted">
                Type {{ place.query }}
              </p>
              <p class="mt-1 text-lg font-semibold tracking-wide text-highlighted">
                <span
                  v-for="(part, index) in place.parts"
                  :key="index"
                  :class="part.match ? 'text-primary' : ''"
                >{{ part.text }}</span>
              </p>
            </div>
          </template>
        </UPageCard>
        <UPageCard
          title="Multi-search"
          description="Pick Multi-search in the menu. Starts, Contains, and Ends are separate boxes, so you never have to type a comma."
          icon="i-lucide-text-cursor-input"
          spotlight
          class="sm:col-span-2 lg:col-span-3"
        >
        <template #footer>
          <div class="grid gap-3 sm:grid-cols-3">
            <div>
              <p class="text-xs font-medium text-muted">
                Starts
              </p>
              <p class="mt-1 rounded-md bg-default px-3 py-2 text-sm font-medium text-highlighted ring ring-inset ring-accented">
                0777
              </p>
            </div>
            <div>
              <p class="text-xs font-medium text-muted">
                Contains
              </p>
              <p class="mt-1 rounded-md bg-default px-3 py-2 text-sm text-dimmed ring ring-inset ring-accented">
                Leave blank
              </p>
            </div>
            <div>
              <p class="text-xs font-medium text-muted">
                Ends
              </p>
              <p class="mt-1 rounded-md bg-default px-3 py-2 text-sm font-medium text-highlighted ring ring-inset ring-accented">
                9
              </p>
            </div>
          </div>
          <p class="mt-4 text-xs font-medium text-muted">
            For example
          </p>
          <p class="mt-1 text-lg font-semibold tracking-wide text-highlighted">
            <span class="text-primary">0777</span><span>0 12345</span><span class="text-primary">9</span>
          </p>
        </template>
        </UPageCard>
      </UPageGrid>
    </UPageSection>

    <UPageSection
      headline="What to type"
      title="A few ways to narrow it down"
      description="The same start, middle, and end can be typed in one box with commas. Letters are read like a phone keypad: ABC is 2, DEF is 3, and so on through to WXYZ on 9."
    >
      <UPageGrid class="lg:grid-cols-2">
        <UPageCard
          v-for="pattern in patterns"
          :key="pattern.query"
          :title="pattern.title"
          :description="pattern.description"
          variant="subtle"
        >
          <template #footer>
            <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p class="text-xs font-medium text-muted">
                  For example
                </p>
                <p class="mt-1 text-lg font-semibold tracking-wide text-highlighted">
                  <span
                    v-for="(part, index) in pattern.parts"
                    :key="index"
                    :class="part.match ? 'text-primary' : ''"
                  >{{ part.text }}</span>
                </p>
              </div>
              <p class="w-fit rounded-md bg-elevated px-2.5 py-1.5 text-sm font-medium text-highlighted">
                Type {{ pattern.query }}
              </p>
            </div>
          </template>
        </UPageCard>
      </UPageGrid>
    </UPageSection>

    <UPageCTA
      title="Ready to look?"
      description="Start with a few digits, or open Multi-search and fill in the start, middle, and end separately."
      variant="subtle"
      :links="[{
        label: 'Search numbers',
        to: shopLink,
        size: 'lg',
        trailingIcon: 'i-lucide-arrow-right'
      }]"
    />
  </div>
</template>
