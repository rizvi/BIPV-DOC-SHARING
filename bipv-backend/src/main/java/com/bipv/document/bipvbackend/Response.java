package com.bipv.document.bipvbackend;

public class Response {

	private boolean status;
	private String message;
	private Object addtionalPayload;
	public boolean getStatus() {
		return status;
	}
	public void setStatus(boolean status) {
		this.status = status;
	}
	public String getMessage() {
		return message;
	}
	public void setMessage(String message) {
		this.message = message;
	}
	public Object getAddtionalPayload() {
		return addtionalPayload;
	}
	public void setAddtionalPayload(Object addtionalPayload) {
		this.addtionalPayload = addtionalPayload;
	}
	public Response(Boolean status, String message, Object addtionalPayload) {
		super();
		this.status = status;
		this.message = message;
		this.addtionalPayload = addtionalPayload;
	}




}
