/* eslint-disable react/jsx-no-target-blank */
/* eslint-disable jsx-a11y/anchor-is-valid */
import React, { Component } from 'react';
import { Icon, Badge, Dropdown, Input, Menu, Breadcrumb, Drawer, Row, Col, Divider } from 'antd';
import { inject, observer } from 'mobx-react';
import { Link, withRouter } from 'react-router-dom';
import classNames from 'classnames';
import MemberAvatar from '../../../components/MemberAvatar';
import TodoPanel from './TodoPanel';
import UiStateKeys from '../../../stores/UiStateKeys';
import { injectIntl, FormattedMessage } from 'react-intl';
import './style.less';

const { Search } = Input;

// const serviceNameMap = {
//   CopUI: 'COP UI',
//   CopApi: 'COP API',
// };

@injectIntl
@withRouter
@inject('appStore')
@observer
class TopBar extends Component {
  state = {
    visible: undefined,
    drawer_visible: false
  };

  async componentDidMount() {
    // const { appStore } = this.props;
    // await appStore.loadBuildInfo();

    // webhookHub.on('on-mr-opened', (mr) => {
    //   appStore.todo.updateMergeRequest([mr]);
    //   message.info('收到一个合并请求');
    // });
  }

  showBoltPortal = () => {
    this.setState({
      visible: true
    });
  }

  hideBoltPortal = () => {
    this.setState({
      visible: false
    });
  }

  signOut = () => {
    let { appStore, history } = this.props;
    appStore.signOut();
    history.push('/sign_in');
  }

  showDrawer = () => {
    this.setState({
      drawer_visible: true
    });
  }

  switchLocale = (locale) => {
    let { appStore: { uiStateStore } } = this.props;
    uiStateStore.setUiState(UiStateKeys.PREFFERED_LANGUAGE, locale);
  }

  hideDrawer = () => {
    this.setState({
      drawer_visible: false
    });
  }

  render() {
    let {
      appStore: {
        teamConfigStore,
        project,
        todo,
        me,
        buildInfo,
        uiStateStore
      },
      location,
      intl,
    } = this.props;
    if (me === undefined) return null;
    let projects = (todo && todo.projects) || [];
    let mergeRequests = (todo && todo.mergeRequests) || [];
    const { visible, drawer_visible } = this.state;
    let num = projects.reduce((acc, p) => acc + p.workItems.length, 0) + mergeRequests.length;
    let latestProjs = uiStateStore.latest_accessed_projects;

    //TODO: refactor
    const ProjectBreadcrumb = ({ project }) => {
      if (!project) return null;
      let { id, name, teams } = project;
      const breadcrumbNameMap = new Map();
      breadcrumbNameMap.set('/projects', intl.formatMessage({ id: 'menu_projects' }));
      breadcrumbNameMap.set(`/projects/${id}`, name);
      for (let p of latestProjs) {
        if (p.id === id) continue;
        breadcrumbNameMap.set(`/projects/${p.id}`, p.name);
      }
      breadcrumbNameMap.set(`/projects/${id}/overview`, intl.formatMessage({ id: 'menu_overview' }));
      breadcrumbNameMap.set(`/projects/${id}/workitems`, intl.formatMessage({ id: 'menu_work_items' }));
      breadcrumbNameMap.set(`/projects/${id}/teams`, intl.formatMessage({ id: 'menu_teams' }));
      breadcrumbNameMap.set(`/projects/${id}/teams/_default`, project.defaultTeam.name);
      breadcrumbNameMap.set(`/projects/${id}/teams/_default/backlogs`, intl.formatMessage({ id: 'menu_backlogs' }));
      breadcrumbNameMap.set(`/projects/${id}/teams/_default/iterations`, intl.formatMessage({ id: 'menu_iterations' }));
      if (project.defaultTeam.currentIteration) {
        breadcrumbNameMap.set(`/projects/${id}/teams/_default/iterations/_current`, project.defaultTeam.currentIteration.name);
      }
      for (let iter of project.defaultTeam.iterations) {
        breadcrumbNameMap.set(`/projects/${id}/teams/_default/iterations/${iter.id}`, iter.name);
      }
      for (let team of teams) {
        breadcrumbNameMap.set(`/projects/${id}/teams/${team.id}`, team.name);
        breadcrumbNameMap.set(`/projects/${id}/teams/${team.id}/backlogs`, intl.formatMessage({ id: 'menu_backlogs' }));
        breadcrumbNameMap.set(`/projects/${id}/teams/${team.id}/iterations`, intl.formatMessage({ id: 'menu_iterations' }));
        if (team.currentIteration) {
          breadcrumbNameMap.set(`/projects/${id}/teams/${team.id}/iterations/_current`, team.currentIteration.name);
        }
        for (let iter of team.iterations) {
          breadcrumbNameMap.set(`/projects/${id}/teams/${team.id}/iterations/${iter.id}`, iter.name);
        }
      }

      breadcrumbNameMap.set(`/projects/${id}/settings`, intl.formatMessage({ id: 'menu_settings' }));
      breadcrumbNameMap.set(`/projects/${id}/settings/overview`, intl.formatMessage({ id: 'menu_overview' }));
      breadcrumbNameMap.set(`/projects/${id}/settings/teams`, intl.formatMessage({ id: 'menu_teams' }));
      breadcrumbNameMap.set(`/projects/${id}/settings/config`, intl.formatMessage({ id: 'menu_project_config' }));
      // breadcrumbNameMap.set(`/projects/${id}/settings/repos`, '代码仓库');
      for (let team of teams) {
        breadcrumbNameMap.set(`/projects/${id}/settings/teams/${team.id}`, team.name);
        breadcrumbNameMap.set(`/projects/${id}/settings/teams/${team.id}/config`, intl.formatMessage({ id: 'menu_team_config' }));
      }

      let pathSnippets = location.pathname.split('/').filter(x => x);
      let restBreadcrumbItems = pathSnippets.flatMap((_, index) => {
        const url = `/${pathSnippets.slice(0, index + 1).join('/')}`;
        let breadcrumbName = breadcrumbNameMap.get(url);
        if (!breadcrumbName) return [];
        let match = url.match(/\/projects\/(?<id>\d+)$/);
        if (match) {
          let projectId = parseInt(match.groups.id);
          return [
            <Breadcrumb.Item key={url}>
              <Dropdown
                overlay={
                  <Menu>
                    {
                      latestProjs.map(proj => {
                        let url = location.pathname;
                        if (projectId !== proj.id) {
                          url = url.replace(/\/projects\/\d+/, `/projects/${proj.id}`);
                          url = url.replace(/\/teams\/\d+/, '/teams/_default');
                          url = url.replace(/\/iterations\/.{36}/, '/iterations/_current');
                        }
                        return (
                          <Menu.Item key={proj.id}>
                            <Link to={url}>
                              <Badge color={proj.id === projectId ? '#1890ff' : '#d9d9d9'} text={proj.name} />
                            </Link>
                          </Menu.Item>
                        );
                      })
                    }
                  </Menu>
                }
                trigger={['click']}
              >
                <Link to={url}>
                  {breadcrumbName}
                  <Icon style={{ paddingLeft: '4px' }} type="down" />
                </Link>
              </Dropdown>
            </Breadcrumb.Item>
          ];
        }
        match = url.match(/settings\/teams\/(?<id>\d+)$/);
        if (match) {
          let teamId = parseInt(match.groups.id);
          return [
            <Breadcrumb.Item key={url}>
              <Dropdown overlay={
                <Menu>
                  {
                    teams.map(team => {
                      return (
                        <Menu.Item key={team.id} onClick={() => {
                          teamConfigStore.selectTeam(team.id);
                        }}>
                          <Link to={location.pathname.replace(/\/teams\/\d+/, `/teams/${team.id}`)}>
                            <Badge color={team.id === teamId ? '#1890ff' : '#d9d9d9'} text={team.name} />
                          </Link>
                        </Menu.Item>
                      );
                    })
                  }
                </Menu>
              }
                trigger={['click']}>
                <Link to={url}>
                  {breadcrumbName}
                  <Icon style={{ paddingLeft: '4px' }} type="down" />
                </Link>
              </Dropdown>
            </Breadcrumb.Item>
          ];
        }
        return [
          <Breadcrumb.Item key={url}>
            <Link to={url}>{breadcrumbName}</Link>
          </Breadcrumb.Item>
        ];
      });
      return (
        <Breadcrumb className='bread-crumb'>
          <Breadcrumb.Item key='/home'>
            <Link to='/home'><Icon type="home" /></Link>
          </Breadcrumb.Item>
          {
            restBreadcrumbItems
          }
        </Breadcrumb>
      )
    }

    return (
      <div className='TopBar' >
        <div className='left'>
          <span>
            <img src={require('../../../images/logo.png')} alt='' />
            <span>{intl.formatMessage({ id: "title" }).toUpperCase()}</span>
          </span>
        </div>
        <div style={{ whiteSpace: 'nowrap', marginRight: 12 }}>
          <ProjectBreadcrumb project={project} />
        </div>
        <div className='right1'></div>
        <div className='right2'></div>
        <div className='right3'>
          <ul>
            <li onClick={this.showBoltPortal}>
              <Badge count={num} overflowCount={99} style={{ marginRight: -5 }}>
                <Icon type="unordered-list" />
              </Badge>
            </li>
            <li>
              <Badge count={0} overflowCount={99} style={{ marginRight: -5 }}>
                <Icon type="notification" />
              </Badge>
            </li>
            <li>
              <Dropdown
                overlay={(
                  <Menu>
                    <Menu.Item>
                      <Link to='/settings/profile'>
                        <Icon type="profile" style={{ marginRight: 8 }} />
                        <span><FormattedMessage id='menu_my_profile' /></span>
                      </Link>
                    </Menu.Item>
                    <Menu.SubMenu title={
                      <span>
                        <Icon type="global" style={{ marginRight: 8 }} />
                        <span style={{ marginRight: 8 }}><FormattedMessage id='menu_language' /></span>
                      </span>
                    }>
                      <Menu.Item onClick={() => this.switchLocale('zhCN')}>
                        <Badge color={uiStateStore.preffered_language === 'zhCN' ? '#1890ff' : '#d9d9d9'} />
                        <FormattedMessage id='menu_chinese' />
                      </Menu.Item>
                      <Menu.Item onClick={() => this.switchLocale('enUS')}>
                        <Badge color={uiStateStore.preffered_language === 'enUS' ? '#1890ff' : '#d9d9d9'} />
                        <FormattedMessage id='menu_english' />
                      </Menu.Item>
                    </Menu.SubMenu>
                    <Menu.Item onClick={this.showDrawer}>
                      <Icon type="question-circle" />
                      <span><FormattedMessage id='munu_about' /></span>
                    </Menu.Item>
                    {/* <Menu.Item>系统设置</Menu.Item> */}
                    <Menu.Divider />
                    <Menu.Item onClick={this.signOut}>
                      <Icon type="logout" />
                      <span> <FormattedMessage id='munu_sign_out' /> </span>
                    </Menu.Item>
                  </Menu>
                )}
                trigger={['click']}>
                {/* <Avatar src={require('./avatar.png')} size={40} style={{ backgroundColor: '#bbb' }} /> */}
                <MemberAvatar member={me} size={40} antiCache />
              </Dropdown>

              <Drawer className='build-info'
                title={
                  <span><Icon type="question-circle" style={{ marginRight: 8 }} />关于</span>
                }
                width='38.2vw'
                visible={drawer_visible}
                onClose={this.hideDrawer}
              >{
                  // !buildInfo ? null :
                  //   [...buildInfo.keys()].map(key => {
                  //     let info = buildInfo.get(key);
                  //     return (
                  //       <div key={key}>
                  //         <Row gutter={[16, 16]}>
                  //           <Col span={12}>
                  //             <Badge status={!info ? 'default' : 'green'} text={serviceNameMap[key] || key} />
                  //           </Col>
                  //           <Col span={12}>&nbsp;</Col>
                  //         </Row>
                  //         {
                  //           !info ? null :
                  //             <div>
                  //               <Row gutter={[16, 16]}>
                  //                 <Col span={12}>版本</Col>
                  //                 <Col span={12}>{info.version}</Col>
                  //               </Row>
                  //               <Row gutter={[16, 16]}>
                  //                 <Col span={12}>环境</Col>
                  //                 <Col span={12}>{info.environment}</Col>
                  //               </Row>
                  //               <Row gutter={[16, 16]}>
                  //                 <Col span={12}>构建号</Col>
                  //                 <Col span={12}>{info.buildNumber}</Col>
                  //               </Row>
                  //               {/* <Row gutter={[16, 16]}>
                  //                 <Col span={12}>分支</Col>
                  //                 <Col span={12}>{info.branch}</Col>
                  //               </Row> */}
                  //               <Row gutter={[16, 16]}>
                  //                 <Col span={12}>哈希</Col>
                  //                 <Col span={12}>{info.hash}</Col>
                  //               </Row>
                  //               <Row gutter={[16, 16]}>
                  //                 <Col span={12}>构建状态</Col>
                  //                 <Col span={12}>
                  //                   <a target='_blank' href={info.runUrl}>
                  //                     <img src={`${info.jenkinsUrl}buildStatus/icon?job=${encodeURI(info.jobName)}`} alt='status' />
                  //                   </a>
                  //                 </Col>
                  //               </Row>
                  //             </div>
                  //         }
                  //         <Divider />
                  //       </div>
                  //     );
                  //   })
                }
              </Drawer>
            </li>
          </ul>
          <Search disabled
            placeholder={intl.formatMessage({ id: 'search' })}
            onSearch={value => console.log(value)}
            style={{ width: 240, height: 32, verticalAlign: 'middle' }} />
        </div>
        <div onClick={this.hideBoltPortal}
          className={classNames(
            { 'bolt-portal-mask': true },
            { 'visible': visible }
          )}
        >
          <div onClick={e => e.stopPropagation()}
            className={classNames(
              { 'bolt-portal': true },
              { 'visible': visible }
            )}>
            {
              (typeof visible === 'undefined') ? null : <TodoPanel />
            }
          </div>
        </div>
      </div>
    );
  }
}

export default TopBar;
