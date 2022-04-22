import React, { Component } from 'react';
import { Tag, Icon } from 'antd';
import { DropTarget } from 'react-dnd';
import moment from 'moment';
import classNames from 'classnames';
import WorkItemIcon from '../../../components/WorkItemIcon';

const boxTarget = {
  drop(props, monitor) {
    let { selected } = monitor.getItem();
    let { onDrop } = props;
    let e = { workItems: selected };
    onDrop && onDrop(e);
  }
};

function targetCollect(connect, monitor) {
  return {
    canDrop: monitor.canDrop(),
    isOver: monitor.isOver(),
    drop: connect.dropTarget()
  }
}

@DropTarget('row', boxTarget, targetCollect)
class IterationBox extends Component {
  render() {
    const { drop, isOver, canDrop, team, iteration, counts, isLoading } = this.props;
    let iterationTagMap = {
      'past': '过去',
      'current': '当前',
      'future': '未来'
    };
    let { tag, startDate, endDate, workdays } = iteration;
    return drop(
      <div
        className={classNames(
          { 'iter-box-dnd': true },
          { 'iter-box-can-drop': canDrop },
          { 'iter-box-is-over': isOver }
        )}
      >
        {
          team ?
            <span style={{ fontSize: 18 }}>
              {`${team.name}团队的工作积压`}
            </span>
            :
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: 18 }}>{iteration.name}</span>
                  {
                    !isLoading ? null :
                      <Icon type='sync' spin style={{ marginLeft: 16 }} />
                  }
                </div>
                <div>
                  <Tag color={tag === 'current' ? '#1890ff' : '#d9d9d9'}>
                    {iterationTagMap[tag]}
                  </Tag>
                </div>
              </div>
              {
                workdays === undefined ? null :
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#a0a0a0' }}>
                    <div>
                      <span>{moment(startDate).format('M月D日')}</span>
                      <span style={{ margin: '0 4px' }}>-</span>
                      <span>{moment(endDate).format('M月D日')}</span>
                    </div>
                    <div>{`${workdays}个工作日`}</div>
                  </div>
              }
              <div>
                {
                  counts && ['story', 'task', 'bug'].map(type => {
                    let typeCountMap = new Map(
                      counts.map(x => [x.workItemType, x.remainingCount + x.completedCount]));
                    let count = typeCountMap.get(type);
                    if (!count) return null;
                    return (
                      <div key={type} style={{ display: 'inline-block', marginTop: 6, marginRight: 32 }}>
                        <WorkItemIcon type={type} />
                        <span style={{ marginLeft: 8, fontWeight: 'bold' }}>{count}</span>
                      </div>
                    )
                  })
                }
              </div>
            </div>
        }
      </div>
    );
  }
}

export default IterationBox;
