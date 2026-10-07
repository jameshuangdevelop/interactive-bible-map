function comparePeriods(left, right) {
  if (left.fromYear !== right.fromYear) {
    return left.fromYear - right.fromYear;
  }
  return left.toYear - right.toYear;
}

function clonePeriod(period) {
  return {
    fromYear: period.fromYear,
    toYear: period.toYear,
    holderId: period.holderId,
    ruler: period.ruler,
    sources: Array.isArray(period.sources) ? [...period.sources] : []
  };
}

function normalizePeriods(periods) {
  return [...periods].map(clonePeriod).sort(comparePeriods);
}

function buildEntityLabel(entity, ruler) {
  if (!entity) {
    return ruler ? `Unknown holder (ruler: ${ruler})` : "Unknown holder";
  }

  if (typeof ruler === "string" && ruler.length > 0) {
    return `${entity.name} (ruler: ${ruler})`;
  }

  return entity.name;
}

function toPoliticalHistoryEntry(period, entitiesById) {
  const entity = entitiesById.get(period.holderId);
  return {
    fromYear: period.fromYear,
    toYear: period.toYear,
    holderId: period.holderId,
    entity: buildEntityLabel(entity, period.ruler),
    sources: [...period.sources]
  };
}

function mergeTouchingPeriods(periods) {
  if (periods.length === 0) {
    return [];
  }

  const merged = [clonePeriod(periods[0])];

  for (const period of periods.slice(1)) {
    const last = merged[merged.length - 1];
    const sameHolder = last.holderId === period.holderId;
    const sameRuler = (last.ruler ?? null) === (period.ruler ?? null);
    const touching = last.toYear === period.fromYear;

    if (sameHolder && sameRuler && touching) {
      const sourceSet = new Set([...last.sources, ...period.sources]);
      last.toYear = period.toYear;
      last.sources = [...sourceSet].sort((left, right) => left.localeCompare(right));
      continue;
    }

    merged.push(clonePeriod(period));
  }

  return merged;
}

function applyOverride(basePeriods, override) {
  const result = [];

  for (const period of basePeriods) {
    if (period.toYear <= override.fromYear || period.fromYear >= override.toYear) {
      result.push(period);
      continue;
    }

    if (period.fromYear < override.fromYear) {
      result.push({
        ...period,
        toYear: override.fromYear
      });
    }

    const overlapFromYear = Math.max(period.fromYear, override.fromYear);
    const overlapToYear = Math.min(period.toYear, override.toYear);
    if (overlapFromYear < overlapToYear) {
      result.push({
        fromYear: overlapFromYear,
        toYear: overlapToYear,
        holderId: override.holderId,
        ruler: override.ruler,
        sources: [...override.sources]
      });
    }

    if (period.toYear > override.toYear) {
      result.push({
        ...period,
        fromYear: override.toYear
      });
    }
  }

  return result;
}

export function derivePoliticalHistoryFromTimeline({
  locationRecord,
  areasById,
  entitiesById
}) {
  const areaId = locationRecord?.politicalAreaId;
  if (typeof areaId !== "string") {
    return null;
  }

  const area = areasById.get(areaId);
  if (!area || !Array.isArray(area.periods)) {
    return null;
  }

  let derivedPeriods = normalizePeriods(area.periods);
  const overrides = Array.isArray(locationRecord.politicalHistoryOverrides)
    ? normalizePeriods(locationRecord.politicalHistoryOverrides)
    : [];

  for (const override of overrides) {
    derivedPeriods = applyOverride(derivedPeriods, override);
    derivedPeriods.sort(comparePeriods);
    derivedPeriods = mergeTouchingPeriods(derivedPeriods);
  }

  return derivedPeriods.map((period) => toPoliticalHistoryEntry(period, entitiesById));
}

export function getStopInForce(stops, year) {
  if (!Array.isArray(stops) || stops.length === 0) {
    return null;
  }

  let selectedStop = null;
  for (const stop of stops) {
    if (typeof stop?.year !== "number") {
      continue;
    }
    if (stop.year <= year && (!selectedStop || stop.year > selectedStop.year)) {
      selectedStop = stop;
    }
  }

  return selectedStop;
}

export function comparePoliticalHistoryEntries(left, right) {
  return (
    left.fromYear === right.fromYear &&
    left.toYear === right.toYear &&
    left.holderId === right.holderId &&
    left.entity === right.entity &&
    JSON.stringify(left.sources) === JSON.stringify(right.sources)
  );
}

