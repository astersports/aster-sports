import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { GRADE_OPTIONS, RELATIONSHIPS } from '../lib/constants';
import {
  INPUT_CLS,
  LABEL_CLS,
  BTN_SECONDARY,
  BTN_PRIMARY,
  BTN_PRIMARY_STYLE,
  CARD_CLS,
  MODAL_BACKDROP,
  MODAL_PANEL,
  MODAL_BACKDROP_CLS,
  MODAL_PANEL_CLS,
  MODAL_CENTER_CLS,
  MODAL_CENTER_PANEL_SM_CLS,
} from '../lib/styles';

// ─── Confirm dialog ──────────────────────────────────────────
function ConfirmDialog({ title, message, confirmLabel = 'Confirm', onConfirm, onClose, danger = false }) {
  const [working, setWorking] = useState(false);
  async function handle() {
    setWorking(true);
    await onConfirm();
  }
  return (
    <div className={MODAL_CENTER_CLS} style={MODAL_BACKDROP} onClick={onClose}>
      <div className={MODAL_CENTER_PANEL_SM_CLS} style={MODAL_PANEL} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-(--color-text-primary) mb-2">{title}</h2>
        {message && <p className="text-sm text-(--color-text-secondary) mb-4">{message}</p>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className={BTN_SECONDARY}>Cancel</button>
          <button
            type="button"
            onClick={handle}
            disabled={working}
            className={`${BTN_PRIMARY} ${danger ? 'bg-red-600 text-white hover:bg-red-700' : ''}`}
            style={danger ? undefined : BTN_PRIMARY_STYLE}
          >
            {working ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Player card ─────────────────────────────────────────────
function PlayerCard({ tp, showTeam, isAdmin, expanded, onToggle, guardians, loadingGuardians, onEdit, onRemove, onManageGuardians }) {
  const player = tp.players;
  const team = tp.teams;
  const isFutures = tp.roster_type === 'futures';
  const borderColor = team?.team_color || 'var(--sf-accent)';

  return (
    <div
      className={CARD_CLS}
      style={{ borderLeftWidth: '4px', borderLeftColor: borderColor }}
      onClick={onToggle}
      role="button"
      tabIndex={0}
      aria-expanded={expanded}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
          e.preventDefault();
          onToggle();
        }
      }}
    >
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold text-(--color-text-primary)">
            {player?.first_name} {player?.last_name}
          </h3>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              isFutures ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {isFutures ? 'Futures' : 'Rostered'}
          </span>
          {tp.jersey_number && (
            <span className="text-xs font-medium text-(--color-text-secondary)">#{tp.jersey_number}</span>
          )}
          {showTeam && team && (
            <span className="text-xs font-medium text-(--color-text-secondary) inline-flex items-center gap-1">
              <span
                className="inline-block w-2 h-2 rounded-full"
                style={{ backgroundColor: team.team_color || 'var(--sf-accent)' }}
              />
              {team.name}
            </span>
          )}
        </div>
        {player?.grade && (
          <p className="text-sm text-(--color-text-secondary) mt-0.5">Grade {player.grade}</p>
        )}
      </div>

      <div
        className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${
          expanded ? 'max-h-[2000px]' : 'max-h-0'
        }`}
      >
        <div
          className="px-4 pb-4 space-y-3 border-t border-(--color-border-tertiary) pt-3"
          onClick={(e) => e.stopPropagation()}
        >
          {isFutures && (
            <div className="bg-purple-50 border border-purple-200 rounded p-2 text-sm text-purple-800">
              <p className="font-medium mb-0.5">Futures Academy</p>
              <p className="text-xs">
                Futures Academy players practice weekly and activate to game-day when the roster
                drops below 8.
              </p>
            </div>
          )}

          {player?.notes && (
            <p className="text-sm text-(--color-text-secondary)">{player.notes}</p>
          )}

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-(--color-text-secondary) mb-2">
              Guardians
            </p>
            {loadingGuardians && (
              <p className="text-sm text-(--color-text-secondary)">Loading guardians...</p>
            )}
            {!loadingGuardians && guardians?.length === 0 && (
              <p className="text-sm text-(--color-text-secondary)">No guardians on file.</p>
            )}
            {!loadingGuardians && guardians?.length > 0 && (
              <div className="space-y-2">
                {guardians.map((pg) => {
                  const g = pg.guardians;
                  if (!g) return null;
                  const relLabel =
                    RELATIONSHIPS.find((r) => r.value === pg.relationship)?.label || pg.relationship;
                  return (
                    <div key={pg.id} className="bg-(--color-background-secondary) rounded p-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-(--color-text-primary)">
                          {g.first_name} {g.last_name}
                        </span>
                        <span className="text-xs text-(--color-text-secondary)">{relLabel}</span>
                        {pg.is_primary && (
                          <span
                            className="text-xs font-medium px-1.5 py-0.5 rounded"
                            style={{
                              backgroundColor: 'var(--sf-accent)',
                              color: 'var(--sf-text-on-dark)',
                            }}
                          >
                            Primary
                          </span>
                        )}
                      </div>
                      {(g.phone || g.email) && (
                        <p className="text-xs text-(--color-text-secondary) mt-0.5">
                          {g.phone && (
                            <a href={`tel:${g.phone}`} className="hover:underline">
                              {g.phone}
                            </a>
                          )}
                          {g.phone && g.email && ' · '}
                          {g.email && (
                            <a href={`mailto:${g.email}`} className="hover:underline">
                              {g.email}
                            </a>
                          )}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {isAdmin && (
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={onEdit}
                className="text-sm font-medium hover:underline"
                style={{ color: 'var(--sf-accent)' }}
              >
                Edit
              </button>
              <button
                onClick={onManageGuardians}
                className="text-sm font-medium hover:underline"
                style={{ color: 'var(--sf-accent)' }}
              >
                Manage Guardians
              </button>
              <button
                onClick={onRemove}
                className="text-sm font-medium text-red-600 hover:underline ml-auto"
              >
                Remove from team
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Player modal (add/edit + team assignments) ─────────────
function PlayerModal({ player, teams, organization, onClose, onSaved }) {
  const [savedPlayer, setSavedPlayer] = useState(player || null);
  const [form, setForm] = useState({
    first_name: player?.first_name || '',
    last_name: player?.last_name || '',
    dob: player?.dob || '',
    grade: player?.grade?.toString() || '',
    notes: player?.notes || '',
  });
  const [savingPlayer, setSavingPlayer] = useState(false);
  const [error, setError] = useState(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [newAssignment, setNewAssignment] = useState({
    team_id: teams[0]?.id || '',
    roster_type: 'rostered',
    jersey_number: '',
  });
  const [assignmentError, setAssignmentError] = useState(null);

  const loadAssignments = useCallback(async () => {
    if (!savedPlayer?.id) return;
    setLoadingAssignments(true);
    const { data } = await supabase
      .from('team_players')
      .select('id, team_id, roster_type, jersey_number, status, teams(id, name, sort_order, team_color)')
      .eq('player_id', savedPlayer.id);
    if (data) {
      setAssignments(
        [...data].sort((a, b) => (a.teams?.sort_order || 0) - (b.teams?.sort_order || 0))
      );
    }
    setLoadingAssignments(false);
  }, [savedPlayer?.id]);

  useEffect(() => {
    loadAssignments();
  }, [loadAssignments]);

  async function handleSavePlayer(e) {
    e?.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('First and last name are required.');
      return;
    }
    setSavingPlayer(true);
    setError(null);
    const payload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      dob: form.dob || null,
      grade: form.grade ? Number(form.grade) : null,
      notes: form.notes.trim() || null,
    };
    let result;
    if (savedPlayer?.id) {
      result = await supabase.from('players').update(payload).eq('id', savedPlayer.id).select().single();
    } else {
      result = await supabase
        .from('players')
        .insert({ ...payload, org_id: organization.id })
        .select()
        .single();
    }
    if (result.error) {
      setError(result.error.message);
      setSavingPlayer(false);
      return;
    }
    setSavedPlayer(result.data);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
    setSavingPlayer(false);
  }

  async function handleAddAssignment() {
    setAssignmentError(null);
    if (!savedPlayer?.id || !newAssignment.team_id) return;
    if (assignments.some((a) => a.team_id === newAssignment.team_id)) {
      setAssignmentError('Player is already on this team.');
      return;
    }
    const { error: insertErr } = await supabase.from('team_players').insert({
      player_id: savedPlayer.id,
      team_id: newAssignment.team_id,
      roster_type: newAssignment.roster_type,
      jersey_number: newAssignment.jersey_number.trim() || null,
    });
    if (insertErr) {
      setAssignmentError(insertErr.message);
      return;
    }
    setNewAssignment({ team_id: teams[0]?.id || '', roster_type: 'rostered', jersey_number: '' });
    loadAssignments();
  }

  async function handleUpdateAssignment(id, fields) {
    const { error: updErr } = await supabase.from('team_players').update(fields).eq('id', id);
    if (updErr) {
      console.error('Failed to update assignment:', updErr);
      setAssignmentError(updErr.message);
      return;
    }
    loadAssignments();
  }

  async function handleRemoveAssignment(id) {
    const { error: delErr } = await supabase.from('team_players').delete().eq('id', id);
    if (delErr) {
      console.error('Failed to remove assignment:', delErr);
      setAssignmentError(delErr.message);
      return;
    }
    loadAssignments();
  }

  function handleClose() {
    onSaved?.();
    onClose();
  }

  const availableTeamsForNew = teams.filter((t) => !assignments.some((a) => a.team_id === t.id));

  return (
    <div className={MODAL_BACKDROP_CLS} style={MODAL_BACKDROP} onClick={handleClose}>
      <div className={MODAL_PANEL_CLS} style={MODAL_PANEL} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-(--color-text-primary) mb-4">
          {savedPlayer?.id ? 'Edit Player' : 'Add Player'}
        </h2>

        {error && (
          <div role="alert" className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSavePlayer} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pl-first" className={LABEL_CLS}>First name</label>
              <input
                id="pl-first"
                required
                value={form.first_name}
                onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label htmlFor="pl-last" className={LABEL_CLS}>Last name</label>
              <input
                id="pl-last"
                required
                value={form.last_name}
                onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                className={INPUT_CLS}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pl-dob" className={LABEL_CLS}>Date of birth</label>
              <input
                id="pl-dob"
                type="date"
                value={form.dob}
                onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label htmlFor="pl-grade" className={LABEL_CLS}>Grade</label>
              <select
                id="pl-grade"
                value={form.grade}
                onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))}
                className={INPUT_CLS}
              >
                <option value="">—</option>
                {GRADE_OPTIONS.map((g) => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="pl-notes" className={LABEL_CLS}>Notes</label>
            <textarea
              id="pl-notes"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className={INPUT_CLS}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={savingPlayer}
              className={BTN_PRIMARY}
              style={BTN_PRIMARY_STYLE}
            >
              {savingPlayer ? 'Saving...' : savedPlayer?.id ? 'Save Player' : 'Save & Continue'}
            </button>
            {savedFlash && <span className="text-sm text-emerald-600">Saved</span>}
          </div>
        </form>

        {/* Team assignments — only after first save */}
        {savedPlayer?.id && (
          <div className="mt-6 pt-4 border-t border-(--color-border-tertiary)">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-(--color-text-secondary) mb-3">
              Team Assignments
            </h3>

            {assignmentError && (
              <div role="alert" className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded mb-3">
                {assignmentError}
              </div>
            )}

            {loadingAssignments && (
              <p className="text-sm text-(--color-text-secondary)">Loading...</p>
            )}

            {!loadingAssignments && assignments.length === 0 && (
              <p className="text-sm text-(--color-text-secondary) mb-3">No team assignments yet.</p>
            )}

            {!loadingAssignments && assignments.length > 0 && (
              <div className="space-y-2 mb-3">
                {assignments.map((a) => (
                  <div key={a.id} className="bg-(--color-background-secondary) rounded p-3">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="inline-flex items-center gap-1.5 font-medium text-(--color-text-primary)">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: a.teams?.team_color || 'var(--sf-accent)' }}
                        />
                        {a.teams?.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveAssignment(a.id)}
                        className="text-xs font-medium text-red-600 hover:underline ml-auto"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-(--color-text-secondary) mb-0.5">
                          Roster type
                        </label>
                        <select
                          value={a.roster_type}
                          onChange={(e) => handleUpdateAssignment(a.id, { roster_type: e.target.value })}
                          className={INPUT_CLS}
                        >
                          <option value="rostered">Rostered</option>
                          <option value="futures">Futures</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-(--color-text-secondary) mb-0.5">
                          Jersey #
                        </label>
                        <input
                          value={a.jersey_number || ''}
                          onChange={(e) =>
                            setAssignments((prev) =>
                              prev.map((x) => (x.id === a.id ? { ...x, jersey_number: e.target.value } : x))
                            )
                          }
                          onBlur={(e) =>
                            handleUpdateAssignment(a.id, { jersey_number: e.target.value.trim() || null })
                          }
                          className={INPUT_CLS}
                          placeholder="e.g. 00, 7, 23"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {availableTeamsForNew.length > 0 && (
              <div className="bg-(--color-background-secondary) rounded p-3">
                <p className="text-xs font-semibold text-(--color-text-secondary) uppercase tracking-wide mb-2">
                  Add to team
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                  <select
                    value={newAssignment.team_id}
                    onChange={(e) => setNewAssignment((a) => ({ ...a, team_id: e.target.value }))}
                    className={INPUT_CLS}
                  >
                    {availableTeamsForNew.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <select
                    value={newAssignment.roster_type}
                    onChange={(e) => setNewAssignment((a) => ({ ...a, roster_type: e.target.value }))}
                    className={INPUT_CLS}
                  >
                    <option value="rostered">Rostered</option>
                    <option value="futures">Futures</option>
                  </select>
                  <input
                    value={newAssignment.jersey_number}
                    onChange={(e) => setNewAssignment((a) => ({ ...a, jersey_number: e.target.value }))}
                    className={INPUT_CLS}
                    placeholder="Jersey # (optional)"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddAssignment}
                  className={BTN_PRIMARY}
                  style={BTN_PRIMARY_STYLE}
                >
                  Add to team
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4 mt-4 border-t border-(--color-border-tertiary)">
          <button type="button" onClick={handleClose} className={BTN_SECONDARY}>Done</button>
        </div>
      </div>
    </div>
  );
}

// ─── Guardian modal ──────────────────────────────────────────
function GuardianModal({ player, organization, onClose, onSaved }) {
  const [pgs, setPgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    relationship: 'parent',
    is_primary: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('player_guardians')
      .select('id, relationship, is_primary, guardian_id, guardians(id, first_name, last_name, email, phone)')
      .eq('player_id', player.id);
    if (data) setPgs(data);
    setLoading(false);
  }, [player.id]);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditing({});
    setForm({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      relationship: 'parent',
      is_primary: false,
    });
  }

  function openEdit(pg) {
    const g = pg.guardians;
    setEditing(pg);
    setForm({
      first_name: g?.first_name || '',
      last_name: g?.last_name || '',
      email: g?.email || '',
      phone: g?.phone || '',
      relationship: pg.relationship,
      is_primary: pg.is_primary,
    });
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError('First and last name are required.');
      return;
    }
    setSaving(true);
    setError(null);
    const guardianPayload = {
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
    };

    if (editing?.id) {
      const { error: gErr } = await supabase
        .from('guardians')
        .update(guardianPayload)
        .eq('id', editing.guardians.id);
      if (gErr) { setError(gErr.message); setSaving(false); return; }
      const { error: pgErr } = await supabase
        .from('player_guardians')
        .update({ relationship: form.relationship, is_primary: form.is_primary })
        .eq('id', editing.id);
      if (pgErr) { setError(pgErr.message); setSaving(false); return; }
    } else {
      // New: try to find existing guardian by email match within org (RLS scopes the search)
      let guardianId = null;
      if (guardianPayload.email) {
        const { data: existing } = await supabase
          .from('guardians')
          .select('id')
          .eq('email', guardianPayload.email)
          .maybeSingle();
        if (existing) guardianId = existing.id;
      }
      if (!guardianId) {
        const { data: created, error: createErr } = await supabase
          .from('guardians')
          .insert({ ...guardianPayload, org_id: organization.id })
          .select()
          .single();
        if (createErr) { setError(createErr.message); setSaving(false); return; }
        guardianId = created.id;
      }
      const { error: linkErr } = await supabase.from('player_guardians').insert({
        player_id: player.id,
        guardian_id: guardianId,
        relationship: form.relationship,
        is_primary: form.is_primary,
      });
      if (linkErr) { setError(linkErr.message); setSaving(false); return; }
    }
    setEditing(null);
    setSaving(false);
    load();
    onSaved?.();
  }

  async function handleRemove(pgId) {
    const { error: delErr } = await supabase.from('player_guardians').delete().eq('id', pgId);
    if (delErr) {
      console.error('Failed to remove guardian:', delErr);
      setError(delErr.message);
      return;
    }
    load();
    onSaved?.();
  }

  return (
    <div className={MODAL_BACKDROP_CLS} style={MODAL_BACKDROP} onClick={onClose}>
      <div className={MODAL_PANEL_CLS} style={MODAL_PANEL} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-(--color-text-primary) mb-1">Manage Guardians</h2>
        <p className="text-sm text-(--color-text-secondary) mb-4">
          {player.first_name} {player.last_name}
        </p>

        {error && (
          <div role="alert" className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded mb-4">
            {error}
          </div>
        )}

        {loading && <p className="text-sm text-(--color-text-secondary)">Loading...</p>}

        {!loading && pgs.length === 0 && !editing && (
          <p className="text-sm text-(--color-text-secondary) mb-3">
            No guardians linked to this player.
          </p>
        )}

        {!loading && pgs.length > 0 && (
          <div className="space-y-2 mb-4">
            {pgs.map((pg) => {
              const g = pg.guardians;
              if (!g) return null;
              const relLabel =
                RELATIONSHIPS.find((r) => r.value === pg.relationship)?.label || pg.relationship;
              return (
                <div key={pg.id} className="bg-(--color-background-secondary) rounded p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-(--color-text-primary)">
                      {g.first_name} {g.last_name}
                    </span>
                    <span className="text-xs text-(--color-text-secondary)">{relLabel}</span>
                    {pg.is_primary && (
                      <span
                        className="text-xs font-medium px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: 'var(--sf-accent)', color: 'var(--sf-text-on-dark)' }}
                      >
                        Primary
                      </span>
                    )}
                    <div className="flex gap-2 ml-auto">
                      <button
                        type="button"
                        onClick={() => openEdit(pg)}
                        className="text-xs font-medium hover:underline"
                        style={{ color: 'var(--sf-accent)' }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(pg.id)}
                        className="text-xs font-medium text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  {(g.phone || g.email) && (
                    <p className="text-xs text-(--color-text-secondary) mt-1">
                      {g.phone && (
                        <a href={`tel:${g.phone}`} className="hover:underline">{g.phone}</a>
                      )}
                      {g.phone && g.email && ' · '}
                      {g.email && (
                        <a href={`mailto:${g.email}`} className="hover:underline">{g.email}</a>
                      )}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!editing && (
          <button
            type="button"
            onClick={openAdd}
            className={BTN_PRIMARY}
            style={BTN_PRIMARY_STYLE}
          >
            + Add Guardian
          </button>
        )}

        {editing && (
          <form
            onSubmit={handleSave}
            className="bg-(--color-background-secondary) rounded p-3 space-y-3 mt-2"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLS}>First name</label>
                <input
                  required
                  value={form.first_name}
                  onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Last name</label>
                <input
                  required
                  value={form.last_name}
                  onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                  className={INPUT_CLS}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLS}>Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className={INPUT_CLS}
                />
              </div>
              <div>
                <label className={LABEL_CLS}>Phone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className={INPUT_CLS}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLS}>Relationship</label>
                <select
                  value={form.relationship}
                  onChange={(e) => setForm((f) => ({ ...f, relationship: e.target.value }))}
                  className={INPUT_CLS}
                >
                  {RELATIONSHIPS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 text-sm text-(--color-text-primary) sm:mt-7">
                <input
                  type="checkbox"
                  checked={form.is_primary}
                  onChange={(e) => setForm((f) => ({ ...f, is_primary: e.target.checked }))}
                  className="rounded"
                />
                Primary contact
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setEditing(null)} className={BTN_SECONDARY}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className={BTN_PRIMARY}
                style={BTN_PRIMARY_STYLE}
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        )}

        <div className="flex justify-end pt-4 mt-4 border-t border-(--color-border-tertiary)">
          <button type="button" onClick={onClose} className={BTN_SECONDARY}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ─── Import modal (CSV bulk import) ──────────────────────────
function ImportModal({ teams, organization, onClose, onSaved }) {
  const [csv, setCsv] = useState('');
  const [parsed, setParsed] = useState([]);
  const [step, setStep] = useState('paste'); // paste | preview | importing | done
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  function parseCsv(text) {
    const lines = text.trim().split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    return lines.slice(1).map((line) => {
      const cells = line.split(',').map((c) => c.trim());
      const obj = {};
      headers.forEach((h, i) => {
        obj[h] = cells[i] || '';
      });
      return obj;
    });
  }

  function handlePreview() {
    setError(null);
    const rows = parseCsv(csv);
    if (rows.length === 0) {
      setError('Could not parse CSV. Make sure the header row is included.');
      return;
    }
    setParsed(rows);
    setStep('preview');
  }

  async function handleImport() {
    setStep('importing');
    setError(null);
    let created = 0;
    let skipped = 0;
    let assignmentsCreated = 0;
    let guardiansCreated = 0;

    const { data: existingPlayers } = await supabase.from('players').select('id, first_name, last_name');
    const existingByName = new Map();
    for (const p of existingPlayers || []) {
      existingByName.set(`${p.first_name.toLowerCase()}|${p.last_name.toLowerCase()}`, p.id);
    }

    for (const row of parsed) {
      const first = (row.first_name || '').trim();
      const last = (row.last_name || '').trim();
      if (!first || !last) continue;
      const key = `${first.toLowerCase()}|${last.toLowerCase()}`;
      let playerId = existingByName.get(key);

      if (!playerId) {
        const gradeNum = row.grade ? Number(row.grade) : null;
        const { data: newPlayer } = await supabase
          .from('players')
          .insert({
            org_id: organization.id,
            first_name: first,
            last_name: last,
            grade: Number.isFinite(gradeNum) ? gradeNum : null,
          })
          .select()
          .single();
        if (newPlayer) {
          playerId = newPlayer.id;
          existingByName.set(key, playerId);
          created++;
        }
      } else {
        skipped++;
      }

      if (playerId && row.team_name) {
        const team = teams.find((t) => t.name.toLowerCase() === row.team_name.toLowerCase());
        if (team) {
          const { error: tpErr } = await supabase.from('team_players').upsert(
            {
              team_id: team.id,
              player_id: playerId,
              roster_type: row.roster_type === 'futures' ? 'futures' : 'rostered',
              jersey_number: row.jersey_number || null,
            },
            { onConflict: 'team_id,player_id' }
          );
          if (!tpErr) assignmentsCreated++;
        }
      }

      if (playerId && row.guardian_name) {
        const parts = row.guardian_name.trim().split(/\s+/);
        const gFirst = parts[0] || row.guardian_name;
        const gLast = parts.slice(1).join(' ') || '';
        let guardianId = null;
        if (row.guardian_email) {
          const { data: g } = await supabase
            .from('guardians')
            .select('id')
            .eq('email', row.guardian_email)
            .maybeSingle();
          if (g) guardianId = g.id;
        }
        if (!guardianId) {
          const { data: newG } = await supabase
            .from('guardians')
            .insert({
              org_id: organization.id,
              first_name: gFirst,
              last_name: gLast,
              email: row.guardian_email || null,
              phone: row.guardian_phone || null,
            })
            .select()
            .single();
          if (newG) {
            guardianId = newG.id;
            guardiansCreated++;
          }
        }
        if (guardianId) {
          await supabase.from('player_guardians').upsert(
            {
              player_id: playerId,
              guardian_id: guardianId,
              relationship: 'parent',
              is_primary: false,
            },
            { onConflict: 'player_id,guardian_id' }
          );
        }
      }
    }

    setResults({ created, skipped, assignmentsCreated, guardiansCreated });
    setStep('done');
    onSaved?.();
  }

  return (
    <div className={MODAL_BACKDROP_CLS} style={MODAL_BACKDROP} onClick={onClose}>
      <div className={MODAL_PANEL_CLS} style={MODAL_PANEL} onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-(--color-text-primary) mb-2">Import Players</h2>
        <p className="text-sm text-(--color-text-secondary) mb-4">
          Paste CSV with columns:{' '}
          <code className="text-xs">
            first_name, last_name, grade, team_name, roster_type, jersey_number, guardian_name,
            guardian_email, guardian_phone
          </code>
        </p>

        {error && (
          <div role="alert" className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded mb-4">
            {error}
          </div>
        )}

        {step === 'paste' && (
          <>
            <textarea
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              rows={10}
              className={`${INPUT_CLS} font-mono text-xs`}
              placeholder={'first_name,last_name,grade,team_name,roster_type,jersey_number,guardian_name,guardian_email,guardian_phone\nJane,Smith,4,10U Black,rostered,7,John Smith,john@example.com,914-555-0100'}
            />
            <div className="flex justify-end gap-3 pt-4">
              <button type="button" onClick={onClose} className={BTN_SECONDARY}>Cancel</button>
              <button
                type="button"
                onClick={handlePreview}
                disabled={!csv.trim()}
                className={BTN_PRIMARY}
                style={BTN_PRIMARY_STYLE}
              >
                Preview
              </button>
            </div>
          </>
        )}

        {step === 'preview' && (
          <>
            <p className="text-sm text-(--color-text-primary) mb-2">
              Preview: {parsed.length} row{parsed.length !== 1 ? 's' : ''}
            </p>
            <div className="overflow-x-auto border border-(--color-border-tertiary) rounded mb-4">
              <table className="w-full text-xs">
                <thead className="bg-(--color-background-secondary)">
                  <tr>
                    <th className="px-2 py-1 text-left font-semibold text-(--color-text-secondary)">Name</th>
                    <th className="px-2 py-1 text-left font-semibold text-(--color-text-secondary)">Grade</th>
                    <th className="px-2 py-1 text-left font-semibold text-(--color-text-secondary)">Team</th>
                    <th className="px-2 py-1 text-left font-semibold text-(--color-text-secondary)">Type</th>
                    <th className="px-2 py-1 text-left font-semibold text-(--color-text-secondary)">#</th>
                    <th className="px-2 py-1 text-left font-semibold text-(--color-text-secondary)">Guardian</th>
                  </tr>
                </thead>
                <tbody>
                  {parsed.map((r, i) => (
                    <tr key={i} className="border-t border-(--color-border-tertiary)">
                      <td className="px-2 py-1 text-(--color-text-primary)">{r.first_name} {r.last_name}</td>
                      <td className="px-2 py-1 text-(--color-text-secondary)">{r.grade || '—'}</td>
                      <td className="px-2 py-1 text-(--color-text-secondary)">{r.team_name || '—'}</td>
                      <td className="px-2 py-1 text-(--color-text-secondary)">{r.roster_type || 'rostered'}</td>
                      <td className="px-2 py-1 text-(--color-text-secondary)">{r.jersey_number || '—'}</td>
                      <td className="px-2 py-1 text-(--color-text-secondary)">{r.guardian_name || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setStep('paste')} className={BTN_SECONDARY}>Back</button>
              <button
                type="button"
                onClick={handleImport}
                className={BTN_PRIMARY}
                style={BTN_PRIMARY_STYLE}
              >
                Import {parsed.length} rows
              </button>
            </div>
          </>
        )}

        {step === 'importing' && (
          <p className="text-sm text-(--color-text-secondary) py-8 text-center">
            Importing... please wait.
          </p>
        )}

        {step === 'done' && results && (
          <>
            <div className="bg-emerald-50 border border-emerald-200 rounded p-3 mb-4 text-sm text-emerald-800">
              <p className="font-medium mb-1">Import complete</p>
              <ul className="list-disc pl-5 space-y-0.5">
                <li>{results.created} new player{results.created !== 1 ? 's' : ''} created</li>
                <li>{results.skipped} duplicate{results.skipped !== 1 ? 's' : ''} skipped</li>
                <li>{results.assignmentsCreated} team assignment{results.assignmentsCreated !== 1 ? 's' : ''}</li>
                <li>{results.guardiansCreated} new guardian{results.guardiansCreated !== 1 ? 's' : ''} created</li>
              </ul>
            </div>
            <div className="flex justify-end">
              <button type="button" onClick={onClose} className={BTN_PRIMARY} style={BTN_PRIMARY_STYLE}>
                Done
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// =================================================================
// MAIN ROSTER PAGE
// =================================================================
export default function Roster() {
  const { userRole, organization } = useAuth();
  const isAdmin = userRole === 'admin';

  const [teams, setTeams] = useState([]);
  const [teamPlayers, setTeamPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [teamFilter, setTeamFilter] = useState('all');
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [guardiansByPlayer, setGuardiansByPlayer] = useState({});
  const [loadingGuardiansSet, setLoadingGuardiansSet] = useState(new Set());

  const [editingPlayer, setEditingPlayer] = useState(null); // null | {} (new) | player object
  const [removingTp, setRemovingTp] = useState(null);
  const [managingPlayer, setManagingPlayer] = useState(null);
  const [showImport, setShowImport] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: seasonData, error: seasonError } = await supabase
      .from('seasons')
      .select('id')
      .eq('status', 'active')
      .single();
    if (seasonError) {
      setError('No active season found.');
      setLoading(false);
      return;
    }

    const [teamsRes, tpRes] = await Promise.all([
      supabase
        .from('teams')
        .select('id, name, sort_order, team_color')
        .eq('season_id', seasonData.id)
        .order('sort_order', { ascending: true }),
      supabase
        .from('team_players')
        .select(
          'id, team_id, player_id, roster_type, jersey_number, status, players(id, first_name, last_name, dob, grade, notes), teams!inner(id, name, sort_order, team_color, season_id)'
        )
        .eq('teams.season_id', seasonData.id)
        .eq('status', 'active'),
    ]);

    if (teamsRes.error || tpRes.error) {
      setError('Failed to load roster.');
      console.error(teamsRes.error || tpRes.error);
      setLoading(false);
      return;
    }

    setTeams(teamsRes.data || []);
    setTeamPlayers(tpRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    let list = teamPlayers;
    if (teamFilter !== 'all') list = list.filter((tp) => tp.team_id === teamFilter);
    return [...list].sort((a, b) => {
      const teamCmp = (a.teams?.sort_order || 0) - (b.teams?.sort_order || 0);
      if (teamCmp !== 0) return teamCmp;
      return (
        (a.players?.last_name || '').localeCompare(b.players?.last_name || '') ||
        (a.players?.first_name || '').localeCompare(b.players?.first_name || '')
      );
    });
  }, [teamPlayers, teamFilter]);

  const loadGuardians = useCallback(
    async (playerId) => {
      if (guardiansByPlayer[playerId]) return;
      setLoadingGuardiansSet((prev) => new Set(prev).add(playerId));
      const { data } = await supabase
        .from('player_guardians')
        .select('id, relationship, is_primary, guardians(id, first_name, last_name, email, phone)')
        .eq('player_id', playerId);
      setGuardiansByPlayer((prev) => ({ ...prev, [playerId]: data || [] }));
      setLoadingGuardiansSet((prev) => {
        const next = new Set(prev);
        next.delete(playerId);
        return next;
      });
    },
    [guardiansByPlayer]
  );

  function toggleExpand(tpId, playerId) {
    const wasExpanded = expandedIds.has(tpId);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(tpId)) next.delete(tpId);
      else next.add(tpId);
      return next;
    });
    if (!wasExpanded) loadGuardians(playerId);
  }

  async function handleRemoveAssignment() {
    if (!removingTp) return;
    const { error: delErr } = await supabase.from('team_players').delete().eq('id', removingTp.id);
    if (delErr) {
      console.error('Failed to remove player from team:', delErr);
      setError(delErr.message);
    }
    setRemovingTp(null);
    loadData();
  }

  function handlePlayerSaved() {
    loadData();
  }

  function handleGuardiansChanged() {
    if (!managingPlayer) return;
    setGuardiansByPlayer((prev) => {
      const next = { ...prev };
      delete next[managingPlayer.id];
      return next;
    });
    loadGuardians(managingPlayer.id);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">Roster</h1>
        {isAdmin && (
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowImport(true)} className={BTN_SECONDARY}>
              Import
            </button>
            <button
              type="button"
              onClick={() => setEditingPlayer({})}
              className={BTN_PRIMARY}
              style={BTN_PRIMARY_STYLE}
            >
              + Add Player
            </button>
          </div>
        )}
      </div>

      <div className="mb-4">
        <select
          value={teamFilter}
          onChange={(e) => setTeamFilter(e.target.value)}
          aria-label="Filter by team"
          className={`${INPUT_CLS} sm:w-auto`}
        >
          <option value="all">All Teams</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      {loading && (
        <p className="text-(--color-text-secondary) py-8 text-center" role="status" aria-live="polite">
          Loading roster...
        </p>
      )}
      {error && <p role="alert" className="text-red-600 py-8 text-center">{error}</p>}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-12">
          <p className="text-(--color-text-secondary) text-lg mb-1">No players on this team yet.</p>
          {isAdmin && (
            <p className="text-(--color-text-secondary) text-sm">
              Add your first player to get started.
            </p>
          )}
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="flex flex-col gap-3">
          {filtered.map((tp) => (
            <PlayerCard
              key={tp.id}
              tp={tp}
              showTeam={teamFilter === 'all'}
              isAdmin={isAdmin}
              expanded={expandedIds.has(tp.id)}
              onToggle={() => toggleExpand(tp.id, tp.player_id)}
              guardians={guardiansByPlayer[tp.player_id]}
              loadingGuardians={loadingGuardiansSet.has(tp.player_id)}
              onEdit={() => setEditingPlayer(tp.players)}
              onRemove={() => setRemovingTp(tp)}
              onManageGuardians={() => setManagingPlayer(tp.players)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {editingPlayer !== null && (
        <PlayerModal
          player={editingPlayer.id ? editingPlayer : null}
          teams={teams}
          organization={organization}
          onClose={() => setEditingPlayer(null)}
          onSaved={handlePlayerSaved}
        />
      )}
      {removingTp && (
        <ConfirmDialog
          title={`Remove ${removingTp.players?.first_name} ${removingTp.players?.last_name}?`}
          message={`This will remove this player from ${removingTp.teams?.name}. The player record itself will not be deleted.`}
          confirmLabel="Remove"
          danger
          onConfirm={handleRemoveAssignment}
          onClose={() => setRemovingTp(null)}
        />
      )}
      {managingPlayer && (
        <GuardianModal
          player={managingPlayer}
          organization={organization}
          onClose={() => setManagingPlayer(null)}
          onSaved={handleGuardiansChanged}
        />
      )}
      {showImport && (
        <ImportModal
          teams={teams}
          organization={organization}
          onClose={() => setShowImport(false)}
          onSaved={() => loadData()}
        />
      )}
    </div>
  );
}
