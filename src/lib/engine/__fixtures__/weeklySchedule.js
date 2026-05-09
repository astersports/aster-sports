// Fixture for renderer #6 — day-sectioned schedule with both standard and
// tournament_placeholder variants. Team colors are real production palette.

export default {
  kind: 'weekly_schedule',
  days: [
    {
      day_label: 'MON · MAY 18',
      events: [
        {
          team_name: '11U Girls',
          team_color: '#7C3AED',
          primary: '11U Girls · Practice',
          secondary: '6:30 - 8:00 PM · WCC',
          variant: 'standard',
        },
        {
          team_name: '10U Black',
          team_color: '#18181B',
          primary: '10U Black · Practice',
          secondary: '6:30 - 8:00 PM · WCC',
          variant: 'standard',
        },
      ],
    },
    {
      day_label: 'TUE · MAY 19',
      events: [
        {
          team_name: '10U Blue',
          team_color: '#2563EB',
          primary: '10U Blue · Practice',
          secondary: '6:00 - 7:30 PM · WCC',
          variant: 'standard',
        },
      ],
    },
    {
      day_label: 'SAT · MAY 23',
      events: [
        {
          team_name: '11U Girls',
          team_color: '#7C3AED',
          primary: '11U Girls · Tournament',
          secondary: 'ZG Rumble for the Ring CT — see Thursday email',
          variant: 'tournament_placeholder',
        },
      ],
    },
  ],
};
