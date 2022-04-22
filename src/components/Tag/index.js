import React, { Component } from 'react';
import { Tag, Icon, Popover, Input, Tooltip, Empty } from 'antd';
import { toJS } from 'mobx';
import { observer, inject } from 'mobx-react';
import { TwitterPicker } from 'react-color';

const colors = [
  "#f44336", "#e91e63", "#f78da7", "#9c27b0", "#673ab7",
  "#3f51b5", "#2196f3", "#03a9f4", "#00bcd4", "#009688",
  "#4caf50", "#8bc34a", "#7bdcb5", "#cddc39", "#ffeb3b",
  "#ffc107", "#ff9800", "#ff5722", "#795548", "#607d8b",
  "#abb8c3", "#CCCCCC", "#B5C6DC", "#D9E3F0"
]

@inject('appStore')
@observer
class ColorPickerTagGroup extends Component {

  state = {
    background: '#FFFFFF',
    tags: [],
    historyTages: [],
    text: '新建标签',
    presentTagVisible: true
  };

  newTagStyle = { background: '#fff', borderStyle: 'dashed', cursor: 'pointer' }
  color = '';
  tagStyle = this.newTagStyle;
  inputLength = 0;
  display;
  presentTagIndex = null;
  closeState = true;

  componentWillReceiveProps() {
    const { workItem } = this.props;
    let tags = toJS(workItem.tags);
    this.setState({
      tags: tags
    });
  }

  componentDidMount() {
    const { workItem } = this.props;
    let tags = toJS(workItem.tags);
    if (tags.length > 0) {
      this.setState({
        tags: tags
      });
    }
  }

  handleChangeComplete = (color) => {
    let { tags } = this.state;
    this.presentTagIndex !== null && (tags[this.presentTagIndex].color = color.hex)
    this.color = color.hex;
    this.setState({ background: color.hex });
  };

  handleOnChange = e => {
    let { tags } = this.state;
    this.inputLength = e.target.value.length;
    if (this.inputLength < 1) {
      this.presentTagIndex !== null && (tags[this.presentTagIndex].text = '')
      this.tagStyle = this.newTagStyle;
      this.color = '';
      this.display = { display: 'inline' };
      this.setState({
        text: ''
      })
    }
    else {
      this.presentTagIndex !== null && (tags[this.presentTagIndex].text = e.target.value)
      this.display = { display: 'none' };
      this.setState({
        text: e.target.value
      })
    }
  };

  handleClose = removedIndex => {
    const { workItem } = this.props;
    let tags = this.state.tags.filter((value, key, arr) => key !== removedIndex);
    this.closeState = false;
    this.presentTagIndex = null;
    this.tagStyle = this.newTagStyle;
    this.color = '';
    this.display = { display: 'inline' };
    this.setState({
      background: '#FFFFFF',
      tags,
      text: '新建标签',
      presentTagVisible: true
    });
    workItem.tags = tags;
  };

  handlePresentTagVisibleChange = (visible, tag, index) => {
    const { text } = this.state;
    let { tags } = this.state;
    let closeState = this.closeState;
    const { workItem } = this.props;
    if (visible === false) {
      closeState && (tags[index].text = text)
      this.presentTagIndex = null;
      this.tagStyle = this.newTagStyle;
      this.color = '';
      this.display = { display: 'inline' };
      this.setState({
        background: '#FFFFFF',
        tags,
        text: '新建标签',
        presentTagVisible: true
      });
    }
    else {
      this.presentTagIndex = index;
      this.color = tag.color;
      this.tagStyle = tag.tagStyle;
      this.setState({
        background: tag.color,
        text: tags[index].text,
        presentTagVisible: false
      });
    }
    closeState = true;
    workItem.tags = tags;
  };

  handleVisibleChange = visible => {
    const { text } = this.state;
    let { tags } = this.state;
    const { workItem } = this.props;
    if (visible === false) {
      if (text && tags.indexOf(text) === -1) {
        tags = [...tags,
        {
          text: text,
          color: this.color
        }
        ];
      }
      this.tagStyle = this.newTagStyle;
      this.color = '';
      this.display = { display: 'inline' };
      this.setState({
        background: '#FFFFFF',
        tags,
        historyTages: tags,
        text: '新建标签'
      });
    }
    else {
      this.inputLength = 0;
      this.setState({
        background: '#FFFFFF',
        text: ''
      });
    }
    workItem.tags = tags;
  };

  handelHistoryTages = (text, color) => {
    let { tags } = this.state;
    const { workItem } = this.props;
    tags = [...tags,
    {
      text: text,
      color: color
    }
    ];
    this.setState({
      tags
    });
    workItem.tags = tags;
  }

  render() {
    const { tags, historyTages, text, presentTagVisible } = this.state;
    let content = (
      <div style={{ width: '276px' }}>
        <Input
          size="small"
          placeholder="请输入标签名"
          onChange={this.handleOnChange}
          value={text}
        />
        <div style={{ marginTop: '15px' }}>
          <TwitterPicker
            color={this.state.background}
            colors={colors}
            onChangeComplete={this.handleChangeComplete}
          />
        </div>
        {/* {presentTagVisible && (
          <div style={{ display: 'grid', textAlign: 'center', marginTop: '15px' }}>
            {historyTages.length > 0 ? (
              historyTages.map((tag, index) => {
                const isLongTag = tag.text.length > 20;
                return (
                  <Tag key={index} color={tag.color} style={{ marginTop: '8px', cursor: 'pointer' }} onClick={() => this.handelHistoryTages(tag.text, tag.color)}>
                    <Tooltip title={tag.text} key={index}>
                      {
                        isLongTag ? `${tag.text.slice(0, 20)}...` : tag.text
                      }
                    </Tooltip>
                  </Tag>
                )
              })
            ) : (
                <Empty description='暂无历史标签' image={Empty.PRESENTED_IMAGE_SIMPLE} />
              )
            }
          </div>
        )} */}
      </div>
    );
    return (
      <div className='colorPickerTagGroup'>
        {
          tags.map((tag, index) => {
            const isLongTag = tag.text.length > 10;
            return (
              <Popover key={index} content={content} trigger='hover' onVisibleChange={(visible) => this.handlePresentTagVisibleChange(visible, tag, index)}>
                <Tag key={index} closable={true} visible={true} onClose={() => this.handleClose(index)} color={tag.color} style={{ ...tag.tagStyle, cursor: 'pointer' }}>
                  <Tooltip title={tag.text} key={index}>
                    {
                      isLongTag ? `${tag.text.slice(0, 5)}...` : tag.text
                    }
                  </Tooltip>
                </Tag>
              </Popover>
            )
          })
        }
        {
          presentTagVisible && (
            <Popover content={content} trigger="click" onVisibleChange={this.handleVisibleChange}>
              <Tag color={this.color} style={this.tagStyle} >
                <Icon type="plus" style={this.display} /> {text}
              </Tag>
            </Popover>
          )
        }
      </div >
    );
  }
}
export default ColorPickerTagGroup;
