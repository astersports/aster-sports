import { INPUT_CLS, LABEL_CLS } from '../lib/styles';

// Shared location dropdown used by EventModal and RecurringModal.
//
// State model — the parent stores three independent fields:
//   baseName    : the venue name from the locations table (e.g. "St. Patrick's Gym")
//                  OR a freeform string when "Custom..." is selected
//   subLocation : the chosen sub-location (e.g. "Court 1") — empty when none
//   address     : the venue address
//
// On save, the parent should concatenate base + sub:
//   payload.location = subLocation ? `${baseName} — ${subLocation}` : baseName
//
// Parsing existing event data on edit:
//   const [base, sub] = (event.location || '').split(' — ');
//
// Why this is split: keeping the base name and sub-location separate
// (instead of stuffing the joined string into a single field) lets the
// dropdowns find the parent location even when a sub-location is selected.

export default function LocationSelect({
  baseName,
  subLocation,
  address,
  locations,
  onChange,
  idPrefix = 'loc',
}) {
  const selectedLoc = locations.find((l) => l.name === baseName);
  const isCustom = !!baseName && !selectedLoc;
  const dropdownValue = selectedLoc ? selectedLoc.id : isCustom ? '__custom' : '';

  function handleSelectChange(e) {
    const v = e.target.value;
    if (v === '') {
      onChange({ baseName: '', subLocation: '', address: '' });
    } else if (v === '__custom') {
      onChange({ baseName: '', subLocation: '', address: '' });
      // Empty so the user immediately sees the custom name input ready for typing.
    } else {
      const loc = locations.find((l) => l.id === v);
      if (loc) {
        onChange({ baseName: loc.name, subLocation: '', address: loc.address || '' });
      }
    }
  }

  // Force the custom-name path to render even when baseName is empty —
  // happens when the user just clicked "Custom...".
  const showCustomInputs = isCustom || dropdownValue === '__custom';

  return (
    <>
      <div>
        <label htmlFor={`${idPrefix}-location`} className={LABEL_CLS}>
          Location
        </label>
        <select
          id={`${idPrefix}-location`}
          value={isCustom ? '__custom' : dropdownValue}
          onChange={handleSelectChange}
          className={INPUT_CLS}
        >
          <option value="">—</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
          <option value="__custom">Custom location...</option>
        </select>
      </div>

      {selectedLoc?.sub_locations?.length > 0 && (
        <div>
          <label htmlFor={`${idPrefix}-sub`} className={LABEL_CLS}>
            Sub-location
          </label>
          <select
            id={`${idPrefix}-sub`}
            value={subLocation || ''}
            onChange={(e) =>
              onChange({
                baseName: selectedLoc.name,
                subLocation: e.target.value,
                address: selectedLoc.address || '',
              })
            }
            className={INPUT_CLS}
          >
            <option value="">None</option>
            {selectedLoc.sub_locations.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}

      {showCustomInputs && (
        <>
          <div>
            <label htmlFor={`${idPrefix}-custom-name`} className={LABEL_CLS}>
              Location name
            </label>
            <input
              id={`${idPrefix}-custom-name`}
              type="text"
              value={baseName || ''}
              onChange={(e) =>
                onChange({ baseName: e.target.value, subLocation: '', address: address || '' })
              }
              className={INPUT_CLS}
              placeholder="Venue name"
            />
          </div>
          <div>
            <label htmlFor={`${idPrefix}-custom-address`} className={LABEL_CLS}>
              Address
            </label>
            <input
              id={`${idPrefix}-custom-address`}
              type="text"
              value={address || ''}
              onChange={(e) =>
                onChange({ baseName: baseName || '', subLocation: '', address: e.target.value })
              }
              className={INPUT_CLS}
              placeholder="Full address for map links and directions"
            />
          </div>
        </>
      )}

      {selectedLoc && address && !selectedLoc.sub_locations?.length && (
        <p className="text-xs text-(--color-text-secondary) -mt-2">{address}</p>
      )}
    </>
  );
}
