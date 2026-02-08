export interface QueryDiffResult {
	status: 'waiting' | 'ready';
	added: string[];
	removed: string[];
	previousCount: number;
	currentCount: number;
}

interface QueryDiffSnapshot {
	url: string;
	queries: string[];
	timestamp: number;
}

const queryDiffKey = 'qm-query-diff-data';
const queryDiffResultKey = 'qm-query-diff-result';

const getCurrentUrl = (): string => {
	return `${ window.location.pathname }${ window.location.search }`;
}

const getWaitingResult = ( currentCount: number ): QueryDiffResult => {
	return {
		status: 'waiting',
		added: [],
		removed: [],
		previousCount: 0,
		currentCount,
	};
}

const saveResult = ( result: QueryDiffResult ): void => {
	sessionStorage.setItem( queryDiffResultKey, JSON.stringify( result ) );
}

const saveSnapshot = ( snapshot: QueryDiffSnapshot ): void => {
	sessionStorage.setItem( queryDiffKey, JSON.stringify( snapshot ) );
}

const parseSnapshot = ( rawSnapshot: string | null ): QueryDiffSnapshot | null => {
	if ( ! rawSnapshot ) {
		return null;
	}

	try {
		const parsed = JSON.parse( rawSnapshot ) as QueryDiffSnapshot;
		if ( ! parsed || ! Array.isArray( parsed.queries ) || typeof parsed.url !== 'string' ) {
			return null;
		}
		return parsed;
	} catch {
		return null;
	}
}

export const computeQueryDiff = ( previous: string[], current: string[] ): QueryDiffResult => {
	const previousCounts = new Map<string, number>();
	const currentCounts = new Map<string, number>();

	previous.forEach( ( sql ) => {
		previousCounts.set( sql, ( previousCounts.get( sql ) ?? 0 ) + 1 );
	} );

	current.forEach( ( sql ) => {
		currentCounts.set( sql, ( currentCounts.get( sql ) ?? 0 ) + 1 );
	} );

	const added: string[] = [];
	const removed: string[] = [];

	currentCounts.forEach( ( currentCount, sql ) => {
		const previousCount = previousCounts.get( sql ) ?? 0;
		const diff = currentCount - previousCount;
		if ( diff > 0 ) {
			for ( let i = 0; i < diff; i++ ) {
				added.push( sql );
			}
		}
	} );

	previousCounts.forEach( ( previousCount, sql ) => {
		const currentCount = currentCounts.get( sql ) ?? 0;
		const diff = previousCount - currentCount;
		if ( diff > 0 ) {
			for ( let i = 0; i < diff; i++ ) {
				removed.push( sql );
			}
		}
	} );

	return {
		status: 'ready',
		added,
		removed,
		previousCount: previous.length,
		currentCount: current.length,
	};
}

export const extractQuerySQL = (
	rows?: Array<{ sql: string }>
): string[] => {
	if ( ! rows?.length ) {
		return [];
	}

	return rows.map( ( row ) => row.sql );
}

export const initializeQueryDiff = (
	enabled: boolean,
	currentQueries: string[]
): QueryDiffResult | null => {
	if ( ! enabled ) {
		sessionStorage.removeItem( queryDiffKey );
		sessionStorage.removeItem( queryDiffResultKey );
		return null;
	}

	const currentUrl = getCurrentUrl();
	const previousSnapshot = parseSnapshot( sessionStorage.getItem( queryDiffKey ) );

	let result = getWaitingResult( currentQueries.length );
	if ( previousSnapshot && previousSnapshot.url === currentUrl ) {
		result = computeQueryDiff( previousSnapshot.queries, currentQueries );
	}

	saveResult( result );
	saveSnapshot( {
		url: currentUrl,
		queries: currentQueries,
		timestamp: Date.now(),
	} );

	return result;
}

export const setQueryDiffEnabled = (
	enabled: boolean,
	currentQueries: string[]
): QueryDiffResult | null => {
	return initializeQueryDiff( enabled, currentQueries );
}

export const readQueryDiffResult = (): QueryDiffResult | null => {
	const rawResult = sessionStorage.getItem( queryDiffResultKey );

	if ( ! rawResult ) {
		return null;
	}

	try {
		const parsed = JSON.parse( rawResult ) as QueryDiffResult;
		if (
			parsed &&
			( parsed.status === 'waiting' || parsed.status === 'ready' ) &&
			Array.isArray( parsed.added ) &&
			Array.isArray( parsed.removed )
		) {
			return parsed;
		}
	} catch {
		// Ignore parse errors.
	}

	return null;
}
