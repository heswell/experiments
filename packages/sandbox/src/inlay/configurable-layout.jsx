import React from 'react';
import {Surface, handleLayout, followPath} from '@heswell/inlay';
import {LayoutConfigurator,LayoutTreeViewer} from '@heswell/inlay-extras'

const NO_STYLES = {};

export default class ConfigurableLayout extends React.Component {
    
    constructor(props){
        super(props)
        this.state = {
          layoutModel: undefined,
          managedLayoutNode: null,
          selectedLayoutNode: null
        };
        this.onChange = this.onChange.bind(this);      
        this.storeLayoutModel = this.storeLayoutModel.bind(this);      
        this.selectComponent = this.selectComponent.bind(this);      
      }

      onChange(feature, dimension, value, layoutStyle){
          console.log(`onChange ${feature} ${dimension} = ${value} ${JSON.stringify(layoutStyle,null,2)}`);
          let {selectedLayoutNode} = this.state;
          const layoutModel = handleLayout(this.state.layoutModel, 'replace', {
              targetNode: selectedLayoutNode,
              replacementNode: {
                  ...selectedLayoutNode,
                  style: layoutStyle
              } 
          });
          console.log(layoutModel)
          // find the selected node in the new layout model
          selectedLayoutNode = followPath(layoutModel, selectedLayoutNode.$path);          

          const [managedLayoutNode] = layoutModel.children;  
          this.setState({
            layoutModel,
            managedLayoutNode,
            selectedLayoutNode
          });
      }

      storeLayoutModel(layoutModel){
        const [managedLayoutNode] = layoutModel.children;
        this.setState({
            layoutModel,
            selectedLayoutNode: managedLayoutNode,
            managedLayoutNode
        })
      }

      selectComponent(selectedLayoutNode){
        console.log(selectedLayoutNode)
        this.setState({selectedLayoutNode});
      }

      render(){
        const {selectedLayoutNode, layoutModel} = this.state;
        const layoutStyle = selectedLayoutNode === null
          ? NO_STYLES
          : selectedLayoutNode.style;

        return (
        <div style={{width: 820, height: 800, position: 'relative'}}>
            <Surface style={{width: 820, height:800}} onLayoutModel={this.storeLayoutModel} layoutModel={layoutModel}>
                {this.props.children}

                <LayoutTreeViewer
                  style={{position: 'absolute', top: 400, left: 0, width: 400, height: 400}} 
                  tree={this.state.managedLayoutNode}
                  selectedNode={selectedLayoutNode}
                  onSelectNode={this.selectComponent}
                />

                <LayoutConfigurator style={{position: 'absolute', top: 400, left: 420, width: 400, height: 400}}
                    layoutStyle={layoutStyle}
                    onChange={this.onChange}/>

            </Surface>
        </div>
        )
      }

}
