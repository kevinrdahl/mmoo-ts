/**
 * Simple data class to encapsulate DAO requests and results
 */
export default class DAOOperation {
	public type:string;
	public data:any = null;
	public result:any = null;
	public failReason:string = null;
	public success:boolean = false;
	public callback:(operation:DAOOperation)=>void;

	constructor(type:string, data:any, callback:(operation:DAOOperation)=>void) {
		this.type = type;
		this.data = data;
		this.callback = callback;
	}
}