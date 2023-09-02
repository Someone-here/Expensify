import React, {useEffect} from 'react';
import PropTypes from 'prop-types';
import {View} from 'react-native';

import {withOnyx} from 'react-native-onyx';
import lodashGet from 'lodash/get';
import _ from 'underscore';
import ONYXKEYS from '../ONYXKEYS';
import CONST from '../CONST';
import * as MapboxToken from '../libs/actions/MapboxToken';
import * as Expensicons from './Icon/Expensicons';
import styles from '../styles/styles';
import transactionPropTypes from './transactionPropTypes';
import BlockingView from './BlockingViews/BlockingView';
import useNetwork from '../hooks/useNetwork';
import useLocalize from '../hooks/useLocalize';
import MapView from './MapView';
import DistanceRequestUtils from '../libs/DistanceRequestUtils';

const propTypes = {
    /** Transaction that stores the distance request data */
    transaction: transactionPropTypes,

    /** Data about Mapbox token for calling Mapbox API */
    mapboxAccessToken: PropTypes.shape({
        /** Temporary token for Mapbox API */
        token: PropTypes.string,

        /** Time when the token will expire in ISO 8601 */
        expiration: PropTypes.string,
    }),
};

const defaultProps = {
    transaction: {},
    mapboxAccessToken: {
        token: '',
    },
};

function ConfirmedRoute({mapboxAccessToken, transaction}) {
    const {isOffline} = useNetwork();
    const {translate} = useLocalize();
    const {route0: route} = transaction.routes || {};
    const waypoints = lodashGet(transaction, 'comment.waypoints', {});
    const coordinates = lodashGet(route, 'geometry.coordinates', []);
    const waypointMarkers = DistanceRequestUtils.getWaypointMarkers(waypoints);

    useEffect(() => {
        MapboxToken.init();
        return MapboxToken.stop;
    }, []);

    return (
        <>
            {!isOffline && Boolean(mapboxAccessToken.token) ? (
                <MapView
                    accessToken={mapboxAccessToken.token}
                    mapPadding={CONST.MAP_PADDING}
                    pitchEnabled={false}
                    directionCoordinates={coordinates}
                    style={styles.mapView}
                    waypoints={waypointMarkers}
                    styleURL={CONST.MAPBOX.STYLE_URL}
                />
            ) : (
                <View style={[styles.mapPendingView]}>
                    <BlockingView
                        icon={Expensicons.EmptyStateRoutePending}
                        title={translate('distance.mapPending.title')}
                        subtitle={isOffline ? translate('distance.mapPending.subtitle') : translate('distance.mapPending.onlineSubtitle')}
                        shouldShowLink={false}
                    />
                </View>
            )}
        </>
    );
}

export default withOnyx({
    transaction: {
        key: ({transactionID}) => `${ONYXKEYS.COLLECTION.TRANSACTION}${transactionID}`,
    },
    mapboxAccessToken: {
        key: ONYXKEYS.MAPBOX_ACCESS_TOKEN,
    },
})(ConfirmedRoute);

ConfirmedRoute.displayName = 'ConfirmedRoute';
ConfirmedRoute.propTypes = propTypes;
ConfirmedRoute.defaultProps = defaultProps;
