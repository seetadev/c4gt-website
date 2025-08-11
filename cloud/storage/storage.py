"""
Cloud Storage Infrastructure

using amazon S3
"""

import json
import os

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_DEFAULT_REGION = os.getenv("AWS_DEFAULT_REGION", "us-east-1")
AWS_S3_ENDPOINT = os.getenv("AWS_S3_ENDPOINT")  # e.g., http://localhost:4566 for LocalStack
AspiringStorageBucket = os.getenv("S3_BUCKET_NAME", "").strip()

if not AspiringStorageBucket:
    raise RuntimeError("S3_BUCKET_NAME is not set. Please set it in your .env")

print("Starting cloud import")

# Create S3 client and resource (Path-style helps with LocalStack and dots in bucket names)
_common_kwargs = dict(
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
    region_name=AWS_DEFAULT_REGION,
)
if AWS_S3_ENDPOINT:
    _common_kwargs_client = dict(
        **_common_kwargs,
        endpoint_url=AWS_S3_ENDPOINT,
        config=Config(s3={"addressing_style": "path"}),
    )
else:
    _common_kwargs_client = _common_kwargs

s3_client = boto3.client("s3", **_common_kwargs_client)

# boto3.resource doesn't accept Config the same way
s3_resource = boto3.resource("s3", endpoint_url=AWS_S3_ENDPOINT, **_common_kwargs)

def _ensure_bucket_exists(bucketname: str):
    """
    Ensure the bucket exists. In LocalStack, create if missing.
    On real AWS, you might want to skip auto-create in prod.
    """
    try:
        s3_client.head_bucket(Bucket=bucketname)
        return True
    except ClientError as e:
        code = e.response.get("Error", {}).get("Code")
        # 404 or NoSuchBucket -> create it (especially in LocalStack)
        if code in ("404", "NoSuchBucket", "NotFound"):
            try:
                # us-east-1 requires no LocationConstraint
                if AWS_S3_ENDPOINT or AWS_DEFAULT_REGION == "us-east-1":
                    s3_client.create_bucket(Bucket=bucketname)
                else:
                    s3_client.create_bucket(
                        Bucket=bucketname,
                        CreateBucketConfiguration={"LocationConstraint": AWS_DEFAULT_REGION},
                    )
                return True
            except ClientError as ce:
                print(f"Error creating bucket: {ce}")
                return False
        # 403 often means wrong creds or bucket owned by another account
        print(f"Error getting bucket: {e}")
        return False

_ensure_bucket_exists(AspiringStorageBucket)

def putItem(path, filedata, bucket_name=None):
    bucket_name = bucket_name or AspiringStorageBucket
    try:
        s3_client.put_object(Bucket=bucket_name, Key=path, Body=filedata)
        return True
    except ClientError as e:
        print(f"Error putting item: {e}")
        return False

def getItem(path, bucket_name=None):
    bucket_name = bucket_name or AspiringStorageBucket
    try:
        response = s3_client.get_object(Bucket=bucket_name, Key=path)
        return response["Body"].read().decode("utf-8")
    except ClientError as e:
        code = e.response.get("Error", {}).get("Code")
        if code in ("NoSuchKey", "404", "NotFound"):
            return None
        print(f"Error getting item: {e}")
        return None

def existsItem(path, bucket_name=None):
    bucket_name = bucket_name or AspiringStorageBucket
    try:
        s3_client.head_object(Bucket=bucket_name, Key=path)
        return True
    except ClientError as e:
        code = e.response.get("Error", {}).get("Code")
        if code in ("NoSuchKey", "404", "NotFound"):
            return False
        if code in ("NoSuchBucket",):
            if _ensure_bucket_exists(bucket_name):
                try:
                    s3_client.head_object(Bucket=bucket_name, Key=path)
                    return True
                except ClientError as e2:
                    code2 = e2.response.get("Error", {}).get("Code")
                    if code2 in ("NoSuchKey", "404", "NotFound"):
                        return False
                    print(f"Error checking item existence after create: {e2}")
                    return False
        # 403 could be wrong creds/endpoint
        print(f"Error checking item existence: {e}")
        return False

def deleteItem(path, bucket_name=None):
    bucket_name = bucket_name or AspiringStorageBucket
    try:
        s3_client.delete_object(Bucket=bucket_name, Key=path)
        return True
    except ClientError as e:
        print(f"Error deleting item: {e}")
        return False

def createBucket(bucketname):
    if _ensure_bucket_exists(bucketname):
        return s3_resource.Bucket(bucketname)
    return None

def getBucket(bucketname):
    try:
        s3_client.head_bucket(Bucket=bucketname)
        return s3_resource.Bucket(bucketname)
    except ClientError as e:
        print(f"Error getting bucket: {e}")
        return None

# ---------------------------
# User file abstraction below
# ---------------------------

class File:
    def __init__(self, name, data):
        self.fname = name
        self.data = data

class Directory:
    def __init__(self, name, filelist):
        self.fname = name
        self.files = [File(i, "") for i in filelist]

def pathToString(path):
    return json.dumps(path)

def createDir(path):
    spath = pathToString(path)
    data = getItem(spath)
    if data is not None:
        print("dir exists")
        return False
    dirdata = {"data": json.dumps([]), "path": path, "type": "dir"}
    if not putItem(spath, json.dumps(dirdata)):
        print("putitem failed")
        return False
    return True

def deleteDir(path):
    # TODO: implement
    pass

def getFileRaw(path):
    pathstr = pathToString(path)
    try:
        response = s3_client.get_object(Bucket=AspiringStorageBucket, Key=pathstr)
        return response["Body"].read()
    except ClientError as e:
        code = e.response.get("Error", {}).get("Code")
        if code in ("NoSuchKey", "404", "NotFound"):
            return None
        print(f"Error reading file: {e}")
        return None

def getFile(path):
    data = getFileRaw(path)
    print("getfile", data)
    if data is None:
        return None
    data_json = json.loads(data.decode("utf-8"))
    if data_json["type"] == "dir":
        fileslist = json.loads(data_json["data"])
        fname = path[-1]
        return Directory(fname, fileslist)
    elif data_json["type"] == "file":
        fname = path[-1]
        return File(fname, data_json["data"])
    else:
        return None

def createFile(path, data):
    if len(path) <= 1:
        print("path too short")
        return False
    ppath = path[:-1]
    parent_data_raw = getFileRaw(ppath)
    if parent_data_raw is None:
        print("parent dir does not exist")
        return False
    parentdata = json.loads(parent_data_raw.decode("utf-8"))
    spath = pathToString(path)
    if getItem(spath) is not None:
        print("file exists")
        return False
    filedata = {"data": data, "path": path, "type": "file"}
    if not putItem(spath, json.dumps(filedata)):
        print("putfile failed")
        return False
    fname = path[-1]
    fileslist = json.loads(parentdata["data"])
    fileslist.append(fname)
    parentdata["data"] = json.dumps(fileslist)
    if not putItem(pathToString(ppath), json.dumps(parentdata)):
        print("putdir failed")
        deleteFile(path)
        return False
    return True

def updateFile(path, data):
    # file must exist
    raw = getFileRaw(path)
    if raw is None:
        return False
    filedata = json.loads(raw.decode("utf-8"))
    filedata["data"] = data
    return putItem(pathToString(path), json.dumps(filedata))

def deleteFile(path):
    raw = getFileRaw(path)
    if raw is None:
        print("file does not exist")
        return False
    filedata = json.loads(raw.decode("utf-8"))
    if filedata.get("type") != "file":
        print("not a file")
        return False
    ppath = path[:-1]
    parent_raw = getFileRaw(ppath)
    if parent_raw is None:
        print("parent data failed")
        return False
    parentdata = json.loads(parent_raw.decode("utf-8"))
    fileslist = json.loads(parentdata["data"])
    fname = path[-1]
    newlist = [i for i in fileslist if i != fname]
    parentdata["data"] = json.dumps(newlist)
    if not putItem(pathToString(ppath), json.dumps(parentdata)):
        print("putdir failed")
        return False
    if not deleteItem(pathToString(path)):
        print("delete file failed")
        return False
    return True

#### The following are unit tests

def unitTestItems():
    putItem("foobar1","test1")
    print(getItem("foobar1"))
    putItem("foobar2","test2")    
    print(getItem("foobar2"))
    deleteItem("foobar1")
    deleteItem("foobar2")
    print(getItem("foobar1")    )
    print(getItem("foobar2")    )

def unitTestItemsInBucket():
    bkt_name = "aspiring-pdf-files"
    putItem("foobar1","test1", bkt_name)
    print(existsItem("foobar1", bkt_name))
    print(getItem("foobar1", bkt_name))
    putItem("foobar2","test2", bkt_name)    
    print(existsItem("foobar2", bkt_name))
    print(getItem("foobar2", bkt_name))
    deleteItem("foobar1", bkt_name)
    deleteItem("foobar2", bkt_name)
    print(existsItem("foobar1", bkt_name))
    print(existsItem("foobar1", bkt_name))
    print(getItem("foobar1", bkt_name)    )
    print(getItem("foobar2", bkt_name)    )


def unitTestFiles():
    path = ["home","demo"]
    print("--create dir--");
    createDir(path)
    print(getFileRaw(path))
    fpath = path[:]
    fpath.append("fname")
    print("--del file--"    );
    deleteFile(fpath)
    print("--create file--"        );
    createFile(fpath, "FileData Test1")
    print(getFileRaw(fpath))
    print(getFileRaw(path))
    print(str(getFile(fpath)))
    print("--update file--"        );
    updateFile(fpath, "FileData Test2")
    print(getFileRaw(fpath))
    print(getFileRaw(path))
    print(str(getFile(fpath)))
    print("--create second file--");
    fpath2 = path[:]
    fpath2.append("fname2")    
    createFile(fpath2, "FileData2 Test1")
    print(getFileRaw(fpath2))
    print(getFileRaw(path))
    print(str(getFile(fpath2)))
    print("--update second file--"        );
    updateFile(fpath2, "FileData2 Test2")
    print(getFileRaw(fpath2))
    print(getFileRaw(path))
    print(str(getFile(fpath2)))
    print("--del file--"    );
    deleteFile(fpath)
    print(getFileRaw(path))
    print(str(getFile(fpath)))
    deleteFile(fpath2)
    print(getFileRaw(path))
    print(str(getFile(fpath)))

print("Cloud imported")

if __name__ == "__main__":
    # unitTestItems()
    # unitTestFiles()
    # unitTestItemsInBucket()
    pass
