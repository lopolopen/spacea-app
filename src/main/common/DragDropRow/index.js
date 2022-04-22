import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { DragSource, DropTarget } from 'react-dnd';
import { getEmptyImage } from 'react-dnd-html5-backend';
import classNames from 'classnames';
import _ from 'lodash';
import { WorkItem } from '../../../stores/WorkItemStore';
import './style.less';


const rowSource = {
  beginDrag(props) {
    return {
      index: props.index,
      record: props.record,
      selected: props.selected,
    };
  },
};

function sourceCollect(connect, monitor) {
  return {
    isDragging: monitor.isDragging(),
    drag: connect.dragSource(),
    preview: connect.dragPreview()
  }
}

const rowTarget = {
  hover(props, monitor, row) {
    if (!this.canDrop(props, monitor)) return;
    let rect = ReactDOM.findDOMNode(row).getBoundingClientRect();
    let item = monitor.getItem();
    let offset = monitor.getClientOffset();
    const { onHover, record } = props;
    const { y, height } = rect;
    let range = record.type.toLowerCase() === 'story' ? 0.5 : 0;
    let bodyH = height * range;
    let gapH = (height - bodyH) / 2;
    let delta = offset.y - y;
    if (delta < gapH) {
      item.location = 'top';
    } else if (delta < gapH + bodyH) {
      item.location = 'center';
    } else {
      item.location = 'bottom';
    }
    if (item.location === 'center') {
      onHover && onHover(record.id);
    }
    row.updateLoc(item.location);
  },

  canDrop(props, monitor) {
    const item = monitor.getItem();
    if (!WorkItem.canMove) return false;
    const selected = item.selected;
    if (!selected || selected.length !== 1) return false;
    const from = item.record;
    const to = props.record;
    return !from.isAncestorOf(to);
  },

  drop(props, monitor) {
    const { record, location } = monitor.getItem();
    const { onDrop } = props;
    let e = {
      from: record,
      to: props.record,
      location
    };
    onDrop && onDrop(e);
  },
};

function targetCollect(connect, monitor) {
  return {
    canDrop: monitor.canDrop(),
    isOver: monitor.isOver(),
    drop: connect.dropTarget()
  }
}

@DropTarget('row', rowTarget, targetCollect)
@DragSource('row', rowSource, sourceCollect)
class DragableRow extends Component {
  state = {};

  updateLoc = _.throttle(location => {
    this.setState({ location });
  }, 0);

  componentDidMount() {
    let { preview } = this.props;
    if (preview) {
      preview(getEmptyImage(), { captureDraggingState: true });
    }
  }

  render() {
    const { location } = this.state;
    const {
      isDragging,
      isOver,
      drag,
      preview,
      drop,
      onHover,
      onDrop,
      canDrop,
      className,
      selected,
      ...restProps
    } = this.props;

    return drop(drag(
      <tr
        className={
          className + ' ' +
          classNames(
            { 'row-dnd': true },
            { 'row-can-drop-up': (location === 'top' && isOver && canDrop) },
            { 'row-can-drop-inside': (location === 'center' && isOver && canDrop) },
            { 'row-can-drop-below': (location === 'bottom' && isOver && canDrop) },
            // { 'row-can-not-drop': (isOver && !canDrop) },
            { 'row-is-dragging': isDragging }
          )}
        {...restProps} />
    ));
  }
}

export default DragableRow;
