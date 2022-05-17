import React, { Component } from 'react';
import { PhotoProvider, PhotoView } from 'react-photo-view';
import 'react-photo-view/dist/react-photo-view.css';

const loadingImg = require('../../../../../images/loading.svg');
const imgExtSet = new Set(["jpg", "jpeg", "png", "bmp", "gif", "svg"]);

class FilePreview extends Component {
  render() {
    let { file, children } = this.props;
    let { previewUrl, fileName } = file;
    let isImg = imgExtSet.has(fileName.split('.').pop());
    return (
      isImg ?
        <PhotoProvider bannerVisible={false}>
          <PhotoView src={previewUrl || loadingImg}>
            <span>
              {children}
            </span>
          </PhotoView>
        </PhotoProvider>
        :
        <span>
          {children}
        </span>
    )
  }
}

export default FilePreview;
