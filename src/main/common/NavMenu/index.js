import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
import { Badge, Icon, Menu, Tag } from 'antd';
import { inject, observer } from 'mobx-react';
import './style.less';

@withRouter
@inject('appStore')
@observer
class NavMenu extends Component {

  render() {
    //ignore staticContext
    let { appStore, items, buildInfo, iconTheme, base, staticContext, ...rest } = this.props;
    let { pageName, subName } = appStore;
    base = base || '';

    return (
      <div className='NavMenu'>
        <Menu className='menu'
          selectedKeys={[pageName, subName]}
          {...rest}
        >
          {
            items.map(({ title, path, type, key, children, disabled, __ }) => {
              if (!children) {
                return __
                  ? (
                    <Menu.Divider key={key} />
                  ) : (
                    <Menu.Item key={key} disabled={disabled}>
                      <Link to={`${base}${path}`}>
                        <Icon type={type || '_'} theme={iconTheme} />
                        <span>{title}</span>
                      </Link>
                    </Menu.Item>);
              };
              return (
                <Menu.SubMenu key={key} disabled={disabled} title={
                  <span>
                    <Icon type={type || '_'} theme={iconTheme} />
                    <span>{title}</span>
                  </span>
                }>
                  {
                    children.map(({ title, path, type, key, more }) => {
                      let sstate, vtype;
                      if (more) {
                        let info = buildInfo && buildInfo.get(key);
                        sstate = info ? 'green' : 'grey';
                        let version = (info && info.version) || '';
                        if (version.includes('alpha')) {
                          vtype = { tag: 'alpha', color: 'red' };
                        } else if (version.includes('beta')) {
                          vtype = { tag: 'beta', color: 'purple' };
                        }
                      }
                      return (
                        <Menu.Item key={key}>
                          <Link to={`${base}${path}`}>
                            <span className='service-state'>
                              {
                                !more ? null : (
                                  <Badge color={sstate} />
                                )
                              }
                            </span>
                            <Icon type={type || '_'} theme={iconTheme} />
                            <span>
                              {title}
                            </span>
                            <span className='service-tag'>
                              {
                                !more ? null : (
                                  vtype && <Tag color={vtype.color}>{vtype.tag}</Tag>
                                )
                              }
                            </span>
                          </Link>
                        </Menu.Item>
                      )
                    })
                  }
                </Menu.SubMenu>);
            })
          }
        </Menu>
      </div>
    );
  }
}

export default NavMenu;
