/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// @flow
import * as React from 'react';
import explicitConnect from '../../utils/connect';
import StackChartCanvas from './Canvas';
import {
  selectedThreadSelectors,
  getDisplayRange,
  getProfileInterval,
  getProfileViewOptions,
} from '../../reducers/profile-view';
import {
  getCategoryColorStrategy,
  getLabelingStrategy,
} from '../../reducers/stack-chart';
import StackChartSettings from './Settings';
import { updateProfileSelection } from '../../actions/profile-view';

import type { Thread } from '../../types/profile';
import type {
  Milliseconds,
  UnitIntervalOfProfileRange,
} from '../../types/units';
import type { StackTimingByDepth } from '../../profile-logic/stack-timing';
import type { GetCategory } from '../../profile-logic/color-categories';
import type { GetLabel } from '../../profile-logic/labeling-strategies';
import type { ProfileSelection } from '../../types/actions';
import type {
  ExplicitConnectOptions,
  ConnectedProps,
} from '../../utils/connect';

require('./index.css');

const STACK_FRAME_HEIGHT = 16;

type StateProps = {|
  +thread: Thread,
  +maxStackDepth: number,
  +stackTimingByDepth: StackTimingByDepth,
  +timeRange: { start: Milliseconds, end: Milliseconds },
  +interval: Milliseconds,
  +getCategory: GetCategory,
  +getLabel: GetLabel,
  +selection: ProfileSelection,
  +threadName: string,
  +processDetails: string,
|};

type DispatchProps = {|
  +updateProfileSelection: typeof updateProfileSelection,
|};

type Props = ConnectedProps<{||}, StateProps, DispatchProps>;

class StackChartGraph extends React.PureComponent<Props> {
  /**
   * Determine the maximum amount available to zoom in.
   */
  getMaximumZoom(): UnitIntervalOfProfileRange {
    const { timeRange: { start, end }, interval } = this.props;
    return interval / (end - start);
  }

  render() {
    const {
      thread,
      maxStackDepth,
      stackTimingByDepth,
      timeRange,
      interval,
      getCategory,
      getLabel,
      selection,
      threadName,
      processDetails,
      updateProfileSelection,
    } = this.props;

    const maxViewportHeight = maxStackDepth * STACK_FRAME_HEIGHT;

    return (
      <div className="stackChart">
        <StackChartSettings />
        <div className="stackChartGraph">
          <div title={processDetails} className="stackChartLabels grippy">
            <span>{threadName}</span>
          </div>
          <StackChartCanvas
            viewportProps={{
              selection,
              timeRange,
              maxViewportHeight,
              viewportNeedsUpdate,
              maximumZoom: this.getMaximumZoom(),
            }}
            chartProps={{
              interval,
              thread,
              getCategory,
              getLabel,
              stackTimingByDepth,
              updateProfileSelection,
              rangeStart: timeRange.start,
              rangeEnd: timeRange.end,
              stackFrameHeight: STACK_FRAME_HEIGHT,
            }}
          />
        </div>
      </div>
    );
  }
}

const options: ExplicitConnectOptions<{||}, StateProps, DispatchProps> = {
  mapStateToProps: state => {
    const stackTimingByDepth = selectedThreadSelectors.getStackTimingByDepthForStackChart(
      state
    );

    return {
      thread: selectedThreadSelectors.getFilteredThreadForStackChart(state),
      maxStackDepth: selectedThreadSelectors.getCallNodeMaxDepthForStackChart(
        state
      ),
      stackTimingByDepth,
      timeRange: getDisplayRange(state),
      interval: getProfileInterval(state),
      getCategory: getCategoryColorStrategy(state),
      getLabel: getLabelingStrategy(state),
      selection: getProfileViewOptions(state).selection,
      threadName: selectedThreadSelectors.getFriendlyThreadName(state),
      processDetails: selectedThreadSelectors.getThreadProcessDetails(state),
    };
  },
  mapDispatchToProps: { updateProfileSelection },
  component: StackChartGraph,
};
export default explicitConnect(options);

// This function is given the StackChartCanvas's chartProps.
function viewportNeedsUpdate(
  prevProps: { +stackTimingByDepth: StackTimingByDepth },
  newProps: { +stackTimingByDepth: StackTimingByDepth }
) {
  return prevProps.stackTimingByDepth !== newProps.stackTimingByDepth;
}
