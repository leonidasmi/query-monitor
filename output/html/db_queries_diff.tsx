import { MainContext } from '../contexts/main-context';
import { NonTabularPanel } from '../panels/non-tabular-panel';
import { readQueryDiffResult } from '../query-diff';
import { DataTypes } from '../data-types';
import { PanelProps } from '../types';
import * as React from 'react';

import {
	__,
	sprintf,
} from '@wordpress/i18n';

export const DBQueriesDiff = ( { data }: PanelProps<DataTypes['db_queries']> ) => {
	const { queryDiffEnabled } = React.useContext( MainContext );
	const [ result, setResult ] = React.useState( () => readQueryDiffResult() );

	React.useEffect( () => {
		setResult( readQueryDiffResult() );
	}, [ queryDiffEnabled, data.rows ] );

	return (
		<NonTabularPanel title={ __( 'Query Diff', 'query-monitor' ) }>
			<div className="qm-query-diff-content">
				{ ! queryDiffEnabled && (
					<p className="qm-query-diff-disabled">
						{ __( 'Query diff tracking is disabled. Enable it in the Settings panel to compare queries between page loads.', 'query-monitor' ) }
					</p>
				) }
				{ queryDiffEnabled && ( ! result || result.status === 'waiting' ) && (
					<p className="qm-query-diff-waiting">
						{ __( 'Refresh this page to compare queries.', 'query-monitor' ) }
					</p>
				) }
				{ queryDiffEnabled && result && result.status === 'ready' && result.added.length === 0 && result.removed.length === 0 && (
					<p className="qm-query-diff-no-changes">
						{ __( 'No query changes detected between page loads.', 'query-monitor' ) }
					</p>
				) }
				{ queryDiffEnabled && result && result.status === 'ready' && ( result.added.length > 0 || result.removed.length > 0 ) && (
					<>
						<p className="qm-query-diff-summary">
							{ sprintf(
								/* translators: 1: Number of queries on previous page load, 2: Number of queries on current page load */
								__( 'Previous: %1$s queries -> Current: %2$s queries', 'query-monitor' ),
								result.previousCount.toString(),
								result.currentCount.toString()
							) }
						</p>

						{ result.added.length > 0 && (
							<div className="qm-query-diff-section qm-query-diff-added">
								<h4>
									{ sprintf(
										/* translators: %s: Number of added queries */
										__( 'Added (%s)', 'query-monitor' ),
										result.added.length.toString()
									) }
								</h4>
								<ul>
									{ result.added.map( ( sql, index ) => (
										<li key={ `${ sql }-${ index }` }>
											<code className="qm-query-diff-sql">
												{ sql }
											</code>
										</li>
									) ) }
								</ul>
							</div>
						) }

						{ result.removed.length > 0 && (
							<div className="qm-query-diff-section qm-query-diff-removed">
								<h4>
									{ sprintf(
										/* translators: %s: Number of removed queries */
										__( 'Removed (%s)', 'query-monitor' ),
										result.removed.length.toString()
									) }
								</h4>
								<ul>
									{ result.removed.map( ( sql, index ) => (
										<li key={ `${ sql }-${ index }` }>
											<code className="qm-query-diff-sql">
												{ sql }
											</code>
										</li>
									) ) }
								</ul>
							</div>
						) }
					</>
				) }
			</div>
		</NonTabularPanel>
	);
};
