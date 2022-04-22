import React,{Component} from 'react';
import { List, Avatar, Spin } from 'antd';
import InfiniteScroll from 'react-infinite-scroller';

import './style.less';

export default class ListView extends Component {
  state = {
    data: [],
    loading: false,
    hasMore: true,
  };

  componentDidMount() {
    this.fetchData(res => {
      this.setState({
        data: res.results,
      });
    });
  }

  fetchData = callback => {
    const {data} = this.props;
    // reqwest({
    //   url: data,
    //   type: 'json',
    //   method: 'get',
    //   contentType: 'application/json',
    //   success: res => {
    //     callback(res);
    //   },
    // });
    callback(data);
  };

  handleInfiniteOnLoad = () => {
    let { data } = this.state;
    this.setState({
      hasMore: false,
      loading: false,
    });
  };

  render() {
    const {projectDetailsUrl,membersUrl} = this.props;
    return (
      <div className="infiniteScrollList">
        <InfiniteScroll
          initialLoad={false}
          pageStart={0}
          loadMore={this.handleInfiniteOnLoad}
          hasMore={!this.state.loading && this.state.hasMore}
          useWindow={false}
        >
          <List
            dataSource={this.state.data}
            renderItem={item => (
              <List.Item key={item.id}>
                <List.Item.Meta
                  avatar={
                    <Avatar src= {item.projectCover} />
                  }
                  title={<a href={projectDetailsUrl} title={item.projectName}>{item.projectName}</a>}
                  description={<div title={item.projectDescribe}>{item.projectDescribe}</div>}               
                />
                <div className='membersHeadPortrait'>                                
                    <Avatar className='creatorHeadPortrait' src={item.creator.creatorHeadPortrait} title={item.creator.creatorUserName}/>                
                    {item.members.map((value,key,arr) => <Avatar src={value.membersHeadPortrait} title={value.membersUserName} key={key}/>)} 
                </div>
                <span className='loadingMembers'><a href={membersUrl}>...</a></span>
                <div>{item.createTime}</div>
              </List.Item>
            )}
          >
            {this.state.loading && this.state.hasMore && (
              <div className="demo-loading-container">
                <Spin />
              </div>
            )}
          </List>
        </InfiniteScroll>
      </div>
    );
  }
}
