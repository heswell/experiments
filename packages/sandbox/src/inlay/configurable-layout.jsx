import React, { useRef, useState, useCallback } from 'react';
import {DynamicContainer, Surface, handleLayout, followPath, Action} from '@heswell/inlay';
import {LayoutConfigurator,LayoutTreeViewer} from '@heswell/inlay-extras'

const NO_STYLES = {};

const SIZE = {width: 820, height: 400};

export default function ConfigurableLayout({children}){
    
    const [managedLayoutNode, setManagedLayoutNode] = useState(null);
    const selectedLayoutNode = useRef(null);
    const layoutDispatcher = useRef(null);

    // constructor(props){
    //     super(props)
    //     this.state = {
    //       layoutModel: undefined,
    //       managedLayoutNode: null,
    //       selectedLayoutNode: null
    //     };
    //     this.onChange = this.onChange.bind(this);      
    //     this.onLayoutModel = this.onLayoutModel.bind(this);      
    //     this.selectComponent = this.selectComponent.bind(this);      
    //   }

      function onChange(feature, dimension, value, editedStyle){
          console.log(`${feature}  (${dimension}) = ${value}`, editedStyle)
          const {$path, style, layoutStyle, ...model} = selectedLayoutNode.current;
          const replacementNode = {
                $path,
                ...model,
                style: {
                  ...style,
                  ...editedStyle
                },
                layoutStyle: {
                  ...layoutStyle,
                  ...editedStyle
                }
          };
          layoutDispatcher.current({
            type: Action.REPLACE,
            target: selectedLayoutNode.current,
            replacement: replacementNode
          });
          // find the selected node in the new layout model
          // selectedLayoutNode = followPath(layoutModel, selectedLayoutNode.$path);          

          // const [managedLayoutNode] = layoutModel.children;  
          // this.setState({
          //   layoutModel,
          //   managedLayoutNode,
          //   selectedLayoutNode
          // });
      }

      // storeLayoutModel(layoutModel){
      //   const [managedLayoutNode] = layoutModel.children;
      //   this.setState({
      //       layoutModel,
      //       selectedLayoutNode: managedLayoutNode,
      //       managedLayoutNode
      //   })
      // }

       const onLayoutModel = useCallback((layoutModel, dispatcher) => {
        if (layoutDispatcher.current === null){
          layoutDispatcher.current = dispatcher;
        }
        if (selectedLayoutNode.current === null){
          selectedLayoutNode.current = layoutModel;
        }
        setManagedLayoutNode(layoutModel);
      },[]);

      function selectComponent(layoutNode){
        console.log(`select`,layoutNode)
        selectedLayoutNode.current = layoutNode
        // this.setState({selectedLayoutNode});
      }

        // const {selectedLayoutNode, layoutModel} = this.state;
        const layoutStyle = selectedLayoutNode.current === null
          ? NO_STYLES
          : selectedLayoutNode.current.style;

      return (
        <div style={{width: 820, height: 800, position: 'relative'}}>
            <Surface style={{width: 820, height:800}} >
                <DynamicContainer style={SIZE} root
                  onLayoutModel={onLayoutModel} >
                  {children}
                </DynamicContainer>

                <LayoutTreeViewer
                  style={{position: 'absolute', top: 400, left: 0, width: 400, height: 400}} 
                  tree={managedLayoutNode}
                  selectedNode={selectedLayoutNode.current}
                  onSelectNode={selectComponent}
                />

                <LayoutConfigurator
                  style={{position: 'absolute', top: 400, left: 420, width: 400, height: 400}}
                  layoutStyle={layoutStyle}
                  onChange={onChange}/>

            </Surface>
        </div>
      )

}
