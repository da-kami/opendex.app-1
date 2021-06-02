import React from 'react';
import PropTypes from 'prop-types';

class DropZone extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      active: false,
      dragover: true,
    };
    this.ref = React.createRef();
  }

  componentDidMount() {
    if (this.ref) {
      this.ref.addEventListener('mouseup', this.onDragLeave);
      this.ref.addEventListener('dragenter', this.onDragEnter);
      this.ref.addEventListener('dragover', this.onDragOver);
      this.ref.addEventListener('drop', this.onDrop);
    }
  }

  componentWillUnmount() {
    if (this.ref) {
      this.ref.removeEventListener('mouseup', this.onDragLeave);
      this.ref.removeEventListener('dragenter', this.onDragEnter);
      this.ref.addEventListener('dragover', this.onDragOver);
      this.ref.removeEventListener('drop', this.onDrop);
    }
  }

  onDrop = e => {
    e.preventDefault();

    this.props.onFileRead(e.dataTransfer.items[0].getAsFile());
    this.setState({ dragover: false });
    this.setState({ active: false });
    return false;
  };

  onDragOver = e => {
    e.preventDefault();
    e.stopPropagation();
    this.setState({ dragover: true });
    return false;
  };

  onDragLeave = e => {
    this.setState({ active: false });
    e.stopPropagation();
    this.setState({ dragover: false });
    e.preventDefault();
    return false;
  };

  onDragEnter = e => {
    this.setState({ className: true });
    e.stopPropagation();
    e.preventDefault();
    this.setState({ dragover: false });
    return false;
  };

  render() {
    const { className, style, children, width, height, ...otherProps } =
      this.props;
    return (
      <div
        className={`${className} drop-area ${
          this.state.dragover ? 'dragging' : ''
        }`}
        style={{ width: width, height: height, ...style }}
        ref={e => (this.ref = e)}
        {...otherProps}
      >
        {children}
      </div>
    );
  }
}

DropZone.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  style: PropTypes.object,
  width: PropTypes.number,
  height: PropTypes.number,
  onFileRead: PropTypes.func.isRequired,
};

export default DropZone;
