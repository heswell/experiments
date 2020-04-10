
const EMPTY_OBJECT = {};

export default function componentReducer(state={}, {type, componentId, ...action}){
	
	//onsole.log(`componentReducer ${type} ${componentId} ${JSON.stringify(action)}`);
	const componentState = state[componentId] || EMPTY_OBJECT; 

	if (type === 'SAVE_CONFIG'){
		return {
			...state,
			[componentId] : {...componentState, ...action.config}
		};
	}
	else if (type === 'TOGGLE_CONFIG'){
		const {targetProperty} = action; 
		const propertyValue = componentState[targetProperty];
		return {
			...state,
			[componentId] : {
				...componentState, 
				[targetProperty] : !propertyValue
			}
		};

	}

	return state;

}