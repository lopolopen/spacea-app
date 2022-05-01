/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from 'react';
import { renderToString } from 'react-dom/server';
import { inject, observer } from 'mobx-react';
import { Input, Select, Row, Col, Form, Icon, Menu, Collapse, AutoComplete, InputNumber, Checkbox, Tabs, message, Button, TreeSelect, Tooltip } from 'antd';
import copy from 'copy-to-clipboard';
import less from 'less';
import moment from 'moment';
import Hotkeys from 'react-hot-keys';
import BraftEditor from 'braft-editor';
import { set } from '../../../utility';
import TreeNode from '../../../stores/TreeNode';
import StateBadge, { stateMap } from '../../../components/StateBadge';
import { typeMap } from '../../../components/WorkItemIcon';
import MemberAvatar from '../../../components/MemberAvatar';
import Path from '../../../components/Path';
import PriorityTag from '../../../components/PriorityTag';
import WorkItemLink from './WorkItemLink';
import WorkItemHistory from './WorkItemHistory';
import WorkItemAttachment from './WorkItemAttachment';
import AttachmentState from '../../../stores/AttachmentState';
import 'braft-editor/dist/index.css'
import './style.less';

const { Option, OptGroup } = Select;
const htmlFields = ['description', 'reproSteps', 'acceptCriteria'];
const specialFields = ['attachments'];

const controls = [
  'undo', 'redo',
  'font-size',
  'text-color',
  'bold',
  'italic',
  'underline',
  'strike-through',
  'superscript',
  'subscript',
  'remove-styles',
  'list-ul',
  'list-ol',
  'blockquote',
  'code',
  'link',
  'hr',
  'media',
  'clear',
  'fullscreen'
];

const template = {
  story: renderToString(
    <div>
      <p>作为 ...</p>
      <p></p>
      <p>我可以 ...</p>
      <p></p>
      <p>来达到 ... 的目的</p>
      <p></p>
    </div>
  )
};

@inject('appStore')
@observer
class WorkItemForm extends Component {

  state = {
    currentKey: 'details',
    wrapperH: 0,
    isClosed: false,
    isProd: false
  };

  extControls = [{
    key: 'storyTemplate',
    type: 'button',
    // text: <img src={require('')} alt='模板' />,
    text: '模板',
    title: '用户故事',
    onClick: () => this.resetTemplate(template.story)
  }];

  componentDidMount() {
    window.addEventListener('resize', this.calcHeight);
    this.calcHeight();
    let { workItem } = this.props.appStore.workItemStore;
    if (workItem) {
      let { type, state, isProd } = workItem;
      if (type === 'task') {
        this.setState({ isClosed: state === 'closed' });
      } else if (type === 'bug') {
        this.setState({
          isClosed: state === 'closed',
          isProd
        });
      }
    }
  }

  componentDidUpdate() {
    const { getFieldsError, getFieldsValue } = this.props.form;
    this.checkError(getFieldsError());
    this.checkChange(getFieldsValue());
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.calcHeight);
  }

  checkError(fieldsError) {
    let { workItem } = this.props.appStore.workItemStore;
    let error = Object.keys(fieldsError).some(field => fieldsError[field]);
    return workItem.setError(error);
  }

  checkChange(fieldsValue) {
    let { workItem } = this.props.appStore.workItemStore;
    let allSet = new Set(Object.keys(fieldsValue));
    let htmlSet = set.intersection(allSet, new Set(htmlFields));
    let simpleSet = set.difference(allSet, new Set([...htmlFields, ...specialFields]));
    let noSimpleChange = [...simpleSet].every(field =>
      // eslint-disable-next-line eqeqeq
      fieldsValue[field] == workItem[field]
    );
    if (!noSimpleChange) {
      return workItem.setNoChange(false);
    }
    let noHtmlChange = [...htmlSet].every(field =>
      fieldsValue[field].toHTML() === (workItem[field] || '<p></p>')
    );
    if (!noHtmlChange) {
      return workItem.setNoChange(false);
    }
    let noSpecialChange = this.noSpecialChange(fieldsValue);
    if (!noSpecialChange) {
      return workItem.setNoChange(false);
    }
    return workItem.setNoChange(true);
  }

  noSpecialChange(fieldsValue) {
    if (!fieldsValue.attachments.every(a => {
      return a.state !== AttachmentState.toadd
        && a.state !== AttachmentState.todel
        && a.state !== AttachmentState.changed;
    })) {
      return false;
    }

    //fieldsValue.tags

    return true;
  }

  calcHeight = () => {
    if (this.wrapper) {
      const rect = this.wrapper.getBoundingClientRect();
      this.setState({ wrapperH: rect.height });
    }
  }

  resetTemplate(temp) {
    const { setFieldsValue } = this.props.form;
    setFieldsValue({
      description: BraftEditor.createEditorState(temp)
    });
  }

  checkProdBug = (isProd) => {
    const { form: { setFieldsValue } } = this.props;
    if (isProd) {
      setFieldsValue({
        environment: 'Production'
      });
    } else {
      setFieldsValue({
        environment: undefined
      });
    }
    this.setState({ isProd });
  }

  async reloadHistories(workItemId) {
    let { appStore } = this.props;
    let { historyStore } = appStore;
    await historyStore.loadHistories(workItemId);
  }

  saveWorkItem(e) {
    e.preventDefault();
    const { appStore, form } = this.props;
    const { workItemStore, analysisStore } = appStore;
    let { workItem } = workItemStore;
    let action = workItem.id ? 'update' : 'new';
    form.validateFields(async (err, values) => {
      try {
        if (err) return;
        let id = await workItemStore.saveWorkItem(values);
        if (action === 'new') {
          message.success(`事项 #${id} 新建成功`);
        } else {
          message.success(`事项 #${id} 更新成功`);
        }
        analysisStore.refreshPanel();
        await this.reloadHistories(id);
      } catch (error) {
        throw error;
      }
    });
  }

  previousOne = () => {

  }

  nextOne = () => {

  }

  render() {
    const { appStore, form } = this.props;
    const { workItemStore, project, metas } = appStore;
    let { workItem } = workItemStore;
    if (!project) return null;
    if (!workItem) return null;
    let { teams, folders, folderTree, iterationTree } = project;
    TreeNode.sortTree(iterationTree);
    let {
      title,
      type,
      assigneeId,
      priority,
      state,
      reason,
      folderId,
      iterationId,
      estimatedHours,
      remainingHours,
      completedHours,
      environment,
      severity,
      description,
      acceptCriteria,
      changedDate,
      changer,
      reproSteps,
      attachments
    } = workItem;

    if (!type) throw new Error('work item must have type');
    let lastChanged;
    let daysGap = moment().diff(changedDate, 'days');
    if (daysGap > 3) {
      lastChanged = moment(changedDate).format('YYYY-M-D');
    }
    else {
      lastChanged = moment(changedDate).fromNow();
    }
    teams.sort((t, _) => t.id === project.selectedTeamId ? -1 : 0);
    const { getFieldDecorator, setFieldsValue } = form;
    less.modifyVars({
      '@work-item-icon-color': typeMap[type].color
    });
    let { currentKey, isClosed, isProd, wrapperH } = this.state;
    return (
      <Form className='WorkItemForm' onSubmit={e => this.saveWorkItem(e)}>
        <div className='work-item-form-head-wrapper'>
          <div className='work-item-form-head'>
            <Form.Item>
              {getFieldDecorator('title', {
                initialValue: title,
                rules: [
                  { required: true, whitespace: true, message: '标题不能为空' },
                  { max: 128, message: '标题不能超过128个字符' }
                ],
              })(
                <Input.Search
                  className='input-title'
                  placeholder='请输入标题'
                  onSearch={text => {
                    copy(text);
                    message.info('标题已复制到剪贴版');
                  }}
                  enterButton={<Icon type='copy' />}
                  ref={ref => this.titleRef = ref}
                />,
              )}
            </Form.Item>

            <Row>
              <Col span={6}>
                <Form.Item>
                  {getFieldDecorator('assigneeId', {
                    initialValue: assigneeId === undefined ? null : assigneeId,
                  })(
                    <Select
                      showArrow={false}
                      showSearch={true}
                      optionFilterProp='label'
                      filterOption={(input, option) => {
                        return option.props.label.toLowerCase().indexOf(input.toLowerCase()) >= 0;
                      }}
                    >
                      <Option value={null} label={'未分配'}>
                        <MemberAvatar.Null size={'small'} labeled />
                      </Option>
                      {
                        teams.map(({ id, name, members }) => {
                          return (
                            <OptGroup label={name} key={id}>
                              {
                                members.map((member) => {
                                  let { id, firstName, lastName } = member;
                                  let name = `${firstName} ${lastName}`;
                                  return (
                                    <Option style={{ display: member.disabled ? 'none' : 'block' }}
                                      key={id} value={id} label={name} >
                                      <MemberAvatar member={member} size={'small'} labeled />
                                    </Option>
                                  )
                                })
                              }
                            </OptGroup>
                          )
                        })
                      }
                    </Select>
                  )}
                </Form.Item>
              </Col>
              <Col span={12} offset={6}>
                <div className='work-item-op-bar'>
                  <div>
                    {/* <ColorPickerTagGroup workItem={workItem} /> */}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center' }}>

                    <Hotkeys
                      disabled={false}
                      keyName='alt+p'
                      onKeyUp={this.previousOne}
                    >
                      <Tooltip title='上一个(Alt + P)'>
                        <a className='icon-btn' style={{ marginRight: 8 }} onClick={this.previousOne} disabled>
                          <Icon className='icon-btn-icon' type="arrow-up" />
                        </a>
                      </Tooltip>
                    </Hotkeys>
                    <Hotkeys
                      disabled={false}
                      keyName='alt+n'
                      onKeyUp={this.nextOne}
                    >
                      <Tooltip title='下一个(Alt + N)'>
                        <a className='icon-btn' style={{ marginRight: 8 }} onClick={this.nextOne} disabled>
                          <Icon className='icon-btn-icon' type="arrow-down" />
                        </a>
                      </Tooltip>
                    </Hotkeys>
                    <Tooltip title='刷新'>
                      <a className='icon-btn' style={{ marginRight: 16 }} onClick={this.refresh} disabled>
                        <Icon className='icon-btn-icon' type='reload' />
                      </a>
                    </Tooltip>
                    <Form.Item>
                      <Button
                        type='primary'
                        htmlType='submit'
                        disabled={workItem.hasError || (workItem.id && workItem.hasNoChange)}
                      >
                        <Icon type='save' />
                        <span>保存</span>
                      </Button>
                    </Form.Item>
                  </div>
                </div>
              </Col>
            </Row >
          </div>
        </div>
        <div className='work-item-form-base-wrapper'>
          <div className='work-item-form-base-left'>
            <div className='work-item-form-base'>
              <Row>
                <Col span={8}>
                  <div className='work-item-property-group'>
                    <div className='work-item-property'>
                      <div className='property-label-s'>
                        <label>状态</label>
                      </div>
                      <div className='property-control'>
                        <Form.Item>
                          {
                            getFieldDecorator('state', {
                              initialValue: state,
                            })(
                              <Select showArrow={false} onChange={s => {
                                setFieldsValue({ reason: stateMap[type][s].defReason });
                                if (type === 'task' || type === 'bug') {
                                  if (s === 'closed') {
                                    setFieldsValue({ remainingHours: 0 });
                                    this.setState({ isClosed: true });
                                  } else {
                                    setFieldsValue({ remainingHours });
                                    this.setState({ isClosed: false });
                                  }
                                }
                              }}>
                                {
                                  Object.keys(stateMap[type]).map(s =>
                                    <Option key={s} value={s}>
                                      <StateBadge state={s} type={type} />
                                    </Option>
                                  )
                                }
                              </Select>
                            )
                          }
                        </Form.Item>
                      </div>
                    </div>
                    <div className='work-item-property'>
                      <div className='property-label-s'>
                        <label>原因</label>
                      </div>
                      <div className='property-control'>
                        <Form.Item>
                          {
                            getFieldDecorator('reason', {
                              initialValue: reason,
                            })(
                              <Input placeholder='请输入状态变更原因' />
                            )
                          }
                        </Form.Item>
                      </div>
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className='work-item-property-group'>
                    <div className='work-item-property'>
                      <div className='property-label'>
                        <label>文件夹</label>
                      </div>
                      <div className='property-control'>
                        <Form.Item>
                          {
                            getFieldDecorator('folderId', {
                              initialValue: folderId,
                            })(
                              <TreeSelect
                                showArrow={false}
                                style={{ width: '100%' }}
                                treeData={folderTree.children}
                                treeDefaultExpandAll
                                treeNodeLabelProp='path'
                              />
                            )
                          }
                        </Form.Item>
                      </div>
                    </div>
                    <div className='work-item-property'>
                      <div className='property-label'>
                        <label>迭代</label>
                      </div>
                      <div className='property-control'>
                        <Form.Item>
                          {getFieldDecorator('iterationId', {
                            initialValue: iterationId,
                          })(
                            <TreeSelect
                              showArrow={false}
                              style={{ width: '100%' }}
                              treeData={iterationTree.children}
                              treeDefaultExpandAll
                              treeNodeLabelProp='path'
                            />
                          )}
                        </Form.Item>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          </div>
          <div className='work-item-form-base-right'>
            <div className='last-changed'>
              {
                !workItem.id ? null :
                  <span>
                    {`${lastChanged} 被`}
                    <MemberAvatar member={changer} labelOnly />
                    {'更新'}
                  </span>
              }
            </div>
            <div>
              <Menu mode='horizontal'
                defaultSelectedKeys={['details']}
                onClick={
                  ({ key }) => this.setState({ currentKey: key })
                } >
                <Menu.Item key='details' >
                  <Icon type='container' />
                  详情
                </Menu.Item>
                <Menu.Item key='history' disabled={!workItem.id} >
                  <Icon type='history' />
                  历史
                </Menu.Item>
                <Menu.Item key='link'>
                  <Icon type='link' />
                  关联
                </Menu.Item>
                <Menu.Item key='attachment'>
                  <Icon type='paper-clip' />
                  <span>附件</span>
                  <span>
                    {
                      attachments.length > 0 ? `(${attachments.length})` : null
                    }
                  </span>
                </Menu.Item>
              </Menu>
            </div>
          </div>
        </div>
        <div className='tabs-wrapper' ref={wrapper => this.wrapper = wrapper}>
          <Tabs activeKey={currentKey}>
            <Tabs.TabPane tab='details' key='details'>
              <div className='work-item-form-details'>
                <Row>
                  <Col span={18}>
                    <div className='collapse-left'>
                      <Collapse defaultActiveKey={['description', 'acceptCriteria', 'reproSteps']} expandIconPosition='right'>
                        {
                          type !== 'bug' ? null :
                            <Collapse.Panel header='重现步骤' key='reproSteps'>
                              <Form.Item>
                                {
                                  getFieldDecorator('reproSteps', {
                                    initialValue: BraftEditor.createEditorState(reproSteps)
                                  })(
                                    <BraftEditor
                                      controls={controls}
                                      placeholder='点击添加重现步骤'
                                    />
                                  )
                                }
                              </Form.Item>
                            </Collapse.Panel>
                        }
                        {
                          <Collapse.Panel header='描述' key='description'>
                            <Form.Item>
                              {
                                getFieldDecorator('description', {
                                  initialValue: BraftEditor.createEditorState(description)
                                })(
                                  <BraftEditor
                                    controls={controls}
                                    extendControls={type === 'story' ? this.extControls : []}
                                    placeholder='点击添加描述'
                                  />
                                )
                              }
                            </Form.Item>
                          </Collapse.Panel>
                        }
                        {
                          type !== 'story' ? null :
                            <Collapse.Panel header='验收标准' key='acceptCriteria'>
                              <Form.Item>
                                {
                                  getFieldDecorator('acceptCriteria', {
                                    initialValue: BraftEditor.createEditorState(acceptCriteria)
                                  })(
                                    <BraftEditor
                                      controls={controls}
                                      placeholder='点击添加验收标准'
                                    />
                                  )
                                }
                              </Form.Item>
                            </Collapse.Panel>
                        }

                        <Collapse.Panel header='讨论' key='discuss' disabled>

                        </Collapse.Panel>
                      </Collapse>
                    </div>
                  </Col>
                  <Col span={6}>
                    <div className='collapse-right'>
                      <Collapse defaultActiveKey={['other']} expandIconPosition='right' onChange={null}>
                        <Collapse.Panel header='其它' key='other'>
                          <div className='work-item-property'>
                            <div><label>优先级</label></div>
                            <Form.Item>
                              {
                                getFieldDecorator('priority', {
                                  initialValue: priority,
                                })(
                                  <Select
                                    showArrow={false}
                                    size='small'
                                    onChange={this.updatePriority}
                                    dropdownClassName='drop-down-fix'
                                    className='priorityTag'
                                  >
                                    {
                                      ['high', 'normal', 'low'].map(p =>
                                        <Option key={p} value={p}><PriorityTag priority={p} /></Option>)
                                    }
                                  </Select>
                                )
                              }
                            </Form.Item>
                          </div>
                          {
                            !(type === 'task' || type === 'bug') ? null :
                              <div>
                                <div className='work-item-property'>
                                  <div><label>预估工时</label></div>
                                  <Form.Item>
                                    {getFieldDecorator('estimatedHours', {
                                      initialValue: estimatedHours
                                    })(
                                      <InputNumber style={{ width: '100%' }} placeholder='请输入预估工时（小时）' min={0} max={1000} step={0.5} />
                                    )}
                                  </Form.Item>
                                </div>

                                <div className='work-item-property'>
                                  <div><label>剩余工时</label></div>
                                  <Form.Item>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                      {getFieldDecorator('remainingHours', {
                                        initialValue: remainingHours
                                      })(
                                        <InputNumber placeholder='请输入剩余工时（小时）' min={0} max={1000} step={0.5} disabled={isClosed}
                                          style={{ width: '100%' }}
                                        />
                                      )}
                                      <Icon type='lock' style={{ display: !isClosed ? 'none' : 'unset', marginLeft: 6 }} />
                                    </div>
                                  </Form.Item>

                                </div>

                                <div className='work-item-property'>
                                  <div><label>完成工时</label></div>
                                  <Form.Item>
                                    {getFieldDecorator('completedHours', {
                                      initialValue: completedHours
                                    })(
                                      <InputNumber style={{ width: '100%' }} placeholder='请输入完成工时（小时）' min={0} max={1000} step={0.5} />
                                    )}
                                  </Form.Item>
                                </div>
                              </div>
                          }
                          {
                            type !== 'bug' ? null :
                              <div>
                                {/* <div>
                                    <div><label>发现时间</label></div>
                                    <Form.Item>
                                      {getFieldDecorator('caughtTime', {
                                        initialValue: null
                                      })(
                                        <DatePicker
                                          id='generationDateTime'
                                          className='datePicker'
                                          format='YYYY-MM-DD HH:mm:ss'
                                          locale={locale}
                                          showTime={{ defaultValue: moment('00:00:00', 'HH:mm:ss') }}
                                          placeholder='请选择发现Bug的时间'
                                        />
                                      )}
                                    </Form.Item>
                                </div> */}
                                <div className='work-item-property'>
                                  <div>
                                    <label>环境</label>
                                    <Checkbox style={{ float: 'right', color: 'rgba(0, 0, 0, 0.85)' }}
                                      defaultChecked={workItem.isProd}
                                      onChange={e => this.checkProdBug(e.target.checked)}>
                                      线上
                                    </Checkbox>
                                  </div>
                                  <Form.Item>
                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                      {getFieldDecorator('environment', {
                                        initialValue: environment
                                      })(
                                        <AutoComplete
                                          placeholder='请输入环境'
                                          dataSource={[
                                            'Development',
                                            'Staging',
                                            'PreProduction',
                                            'Production'
                                          ]}
                                          filterOption={(ipt, { props }) =>
                                            props.children.toUpperCase().indexOf(ipt.toUpperCase()) !== -1
                                          }
                                          disabled={isProd}
                                        />
                                      )}
                                      <Icon type='lock' style={{ display: !isProd ? 'none' : 'unset', marginLeft: 6 }} />
                                    </div>
                                  </Form.Item>
                                </div>
                                <div className='work-item-property'>
                                  <div>
                                    <label>严重级别</label>
                                  </div>
                                  <Form.Item>
                                    {getFieldDecorator('severity', {
                                      initialValue: severity
                                    })(
                                      <Select showArrow={false} placeholder='请选择严重级别'>
                                        {
                                          (metas.enums.severity || []).map(s =>
                                            <Option key={s.value} value={s.value}>{s.displayName}</Option>
                                          )
                                        }
                                      </Select>
                                    )}
                                  </Form.Item>
                                </div>
                              </div>
                          }
                        </Collapse.Panel>
                      </Collapse>
                    </div>
                  </Col>
                </Row>
              </div>
            </Tabs.TabPane>
            <Tabs.TabPane tab='link' key='link'>
              <WorkItemLink projectId={project.id} workItem={workItem} />
            </Tabs.TabPane>
            <Tabs.TabPane tab='history' key='history' disabled={!workItem.id}>
              <WorkItemHistory workItem={workItem} wrapperH={wrapperH} />
            </Tabs.TabPane>
            <Tabs.TabPane tab='attachment' key='attachment'>
              <Form.Item>
                {
                  getFieldDecorator('attachments', {
                    initialValue: attachments
                  })(<WorkItemAttachment />)
                }
              </Form.Item>
            </Tabs.TabPane>
          </Tabs>
        </div>
      </Form >
    )
  }
}
export default WorkItemForm;
