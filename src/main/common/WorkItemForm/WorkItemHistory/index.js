/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from 'react';
import { inject, observer } from 'mobx-react';
import { Timeline, Row, Col, Collapse } from 'antd';
import moment from 'moment';
import classNames from 'classnames';
import { stateMap } from '../../../../components/StateBadge';
import MemberAvatar from '../../../../components/MemberAvatar';
import VisualDiff from 'react-visual-diff';
import JsxParser from 'react-jsx-parser';
import './style.less';

const blockElements = ['div', 'hr', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'p'];
let renderChange = function renderChange({ type, children }) {
  if (children == null) {
    return null;
  }
  if (blockElements.includes(children.type)) {
    return (
      <div className={type}>
        {children}
      </div>
    );
  }
  return (
    <span className={type} style={{ display: 'inline-block' }}>
      {children}
    </span>
  );
};

const dateLabelMap = {
  today: '今天',
  yesterday: '昨天',
  tdby: '前天',
  older: '更久之前'
};

@inject('appStore')
@observer
class WorkItemHistory extends Component {
  state = {
    selected: undefined
  }

  async componentDidMount() {
    let { appStore, workItem } = this.props;
    let { historyStore } = appStore;
    if (workItem.id) {
      await historyStore.loadHistories(workItem.id);
    }
  }

  componentWillUnmount() {
    let { appStore } = this.props;
    let { historyStore } = appStore;
    historyStore.clearHistories();
  }

  pickOneDiff(diff) {
    this.setState({
      selected: diff
    });
  }

  render() {
    let { appStore, workItem, wrapperH } = this.props;
    let { historyStore } = appStore;
    let { groupedDiffs } = historyStore;
    if (!groupedDiffs) return null;
    let defKey = groupedDiffs[0] && groupedDiffs[0].dateLabel;
    let { type } = workItem;
    let { selected } = this.state;
    let diffPoints = selected && selected.diffPoints;
    return (
      <div className='WorkItemHistory'>
        <Row>
          <Col span={8}>
            <div className='history-timeline' style={{ height: wrapperH - 25 }}>
              <Collapse
                expandIconPosition='right'
                defaultActiveKey={defKey}
              >
                {
                  groupedDiffs.map(({ dateLabel, diffs }) => (
                    <Collapse.Panel key={dateLabel}
                      header={dateLabelMap[dateLabel]}
                    >
                      <Timeline reverse>
                        {
                          diffs.map((diff) => {
                            let { rev, item, changer, title } = diff;
                            let { state, changedDate } = item;
                            let color = (stateMap[type][state] || stateMap[`${type}_obsolete`][state]).status;
                            if (color === 'default') color = '#d9d9d9';
                            let timeFromNow;
                            let daysGap = moment().diff(changedDate, 'days');
                            if (daysGap > 3) {
                              timeFromNow = moment(changedDate).format('YYYY-M-D');
                            }
                            else {
                              timeFromNow = moment(changedDate).fromNow();
                            }
                            return (
                              <Timeline.Item key={rev} color={color}>
                                <a
                                  className={classNames(
                                    { 'history-diff-item': true },
                                    { 'active': selected && selected.rev === rev }
                                  )}
                                  onClick={() => this.pickOneDiff(diff)}
                                >
                                  <div>
                                    <MemberAvatar member={changer} labelOnly />
                                    <span>{title}</span>
                                  </div>
                                  <span>{timeFromNow}</span>
                                </a>
                              </Timeline.Item>
                            );
                          })
                        }
                      </Timeline>
                    </Collapse.Panel>
                  ))
                }
              </Collapse>
            </div>
          </Col>
          <Col span={16}>
            {
              !diffPoints ? null :
                <div>
                  <div className='selected-diff-item'>
                    <div>
                      <MemberAvatar member={selected.changer} labeled />
                      <span>{selected.title}</span>
                    </div>
                    <div>
                      <span>{moment(selected.item.changedDate).format('YYYY-MM-DD HH:mm')}</span>
                    </div>
                  </div>
                  <div className='history-diff-points-wrapper'>
                    <div className='history-diff-points'>
                      {
                        diffPoints.map(dp => (
                          <div className='history-diff-point' key={dp.label}>
                            <div className='history-diff-field' >
                              <label>{dp.label}</label>
                            </div>
                            <div className='history-diff-main'>
                              <div className='field-diff'>
                                <VisualDiff
                                  left={
                                    !dp.isHtml ?
                                      <span>{(dp.rev === 0 ? '' : dp.oldValue)}</span>
                                      :
                                      <JsxParser jsx={dp.oldValue} />
                                  }
                                  right={
                                    !dp.isHtml ?
                                      <span>{dp.newValue}</span>
                                      :
                                      <JsxParser jsx={dp.newValue} />
                                  }
                                  renderChange={renderChange}
                                />
                              </div>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </div>
            }
          </Col>
        </Row>
      </div >
    );
  }
}

export default WorkItemHistory;
