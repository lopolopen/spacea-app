import React, { Component } from 'react';
import { DragLayer } from 'react-dnd';
import _ from 'lodash';
import WorkItemIcon from '../../../components/WorkItemIcon';

const layerStyles = {
  position: 'fixed',
  pointerEvents: 'none',
  zIndex: 100,
  left: 0,
  top: 0,
  right: 0,
  bottom: 0,
};

function collect(monitor) {
  let item = monitor.getItem();
  return {
    selected: item && item.selected,
    type: monitor.getItemType(),
    offset: monitor.getClientOffset(),
    isDragging: monitor.isDragging()
  };
}

@DragLayer(collect)
class WorkItemDragLayer extends Component {

  getItemStyles() {
    const { offset } = this.props;
    if (!offset) {
      return {
        display: 'none'
      };
    }
    const { x, y } = offset;
    const transform = `translate(${x}px, ${y}px)`;
    return {
      transform: transform,
      WebkitTransform: transform
    };
  }

  render() {
    let { selected, type, isDragging } = this.props;
    if (!isDragging || type !== 'row') {
      return null;
    }
    let groupedItems = _.groupBy(selected, 'type');
    return (
      <div style={layerStyles}>
        <div style={this.getItemStyles()}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, .6)',
            border: '2px solid #a0a0a0',
            width: 120,
            height: 80,
            marginTop: -80,
            padding: '6px 16px'
          }}>
            <div style={{ width: 40 }}>
              {
                ['story', 'task', 'bug'].map(type => {
                  let group = groupedItems[type];
                  return group && (
                    <div key={type} style={{
                      display: 'flex',
                      justifyContent: 'space-between'
                    }} >
                      <WorkItemIcon type={type} />
                      <span>{group.length}</span>
                    </div>
                  )
                })
              }
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: 24, fontWeight: 'bold' }}>
                {selected ? selected.length : 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default WorkItemDragLayer;
